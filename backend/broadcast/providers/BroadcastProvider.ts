import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

import { serverConfigurations } from '../../ServerConfigurations.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { JWTMiddleware, JWTVerifyPayload } from '../../core/middleware/JWTMiddleware.js';
import { ACLMiddleware } from '../../core/middleware/ACLMiddleware.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { MemcacheProvider } from '../../core/redis/providers/MemcacheProvider.js';
import { envLoader } from '../../common/EnvLoader.js';
import { IUser } from '../../db/models/User.js';
import { BroadcastOpts, BroadcastRoomConnect, BroadcastRoomData, BroadcastSocket, EVENT_MAP } from '../types/Broadcast.js';


export class BroadcastProvider {
  private __io: Server;
  private __memcache: MemcacheProvider;
  private __jwtMiddleware = new JWTMiddleware({ secret: envLoader.JWT_SECRET, timespanInSec: envLoader.JWT_TIMEOUT });
  private __zLog = new LogProvider(BroadcastProvider.name);

  constructor(private __server: HttpServer, private __opts: BroadcastOpts) {
    this.__memcache = new MemcacheProvider({ db: 'room_cache', ...this.__opts }); // connect to redis memcache
    this.__initialize();
  }

  private __initialize() { // initialize the socket.io server
    this.__io = new Server(this.__server, { // bind the socket.io server to the underlying express server
      path: '/socket.io/', 
      allowEIO3: true,
      pingInterval: 20000, 
      pingTimeout: 60000, 
      allowUpgrades: true, 
      transports: [ 'polling', 'websocket' ], // start with polling, upgrade to websocket
      cors: { 
        origin: `https://${envLoader.SIGHT_PLATFORM_ENDPOINT}`, // origin should be the externally facing load balancer
        methods: [ 'GET', 'POST' ],
        credentials: true // load balancer will set a session cookie, need sticky sessions since connections served over http
      }
    });

    this.__io.adapter(createAdapter(this.__memcache.client.duplicate(), this.__memcache.client.duplicate())); // create redis pub/sub adapter

    this.__io.use(async (socket: BroadcastSocket, next) => { // validate incoming request
      const token = socket.handshake.query.token as string; // set query args on handshake
      
      const { verified, payload } = await this.__checkAuth(token); // check incoming auth token
      if (! verified) return next(new Error('socket.io authentication error'));
      if (payload?.newToken) this.__io.to(socket.id).emit(EVENT_MAP.io.refresh_token, payload.newToken);

      socket.user = payload.user;
      socket.exp = payload.exp; // set time to expire connection on socket
      
      return next();
    });

    this.__io.on(EVENT_MAP.io.connection, (socket: BroadcastSocket) => {
      try {
        if (! socket?.user || ! socket?.exp) throw new Error(`incoming socket has not been validated`);
        this.__zLog.info(`socket connection made with id ${socket.id}`);
        this.__handleConnection(socket);
      } catch(err) {
        this.__zLog.error(`connection error: ${NodeUtil.extractErrorMessage(err)}`);
        socket.disconnect();
        throw err;
      }
    });

    this.__io.on('error', err => {
      this.__zLog.error(`io error: ${NodeUtil.extractErrorMessage(err)}`);
    });
  }

  private async __handleConnection<T>(socket: BroadcastSocket) {
    await this.__setUserMeta(socket);

    socket.on(EVENT_MAP.room.join, async (opts: BroadcastRoomConnect) => { // handle validated socket connections
      if (opts.roomType === 'org' && opts.roomId !== socket.user.orgId) throw new Error('incoming user is not in room organization');
      try { // map the incoming socket id to the room - socket map and join the db
        const roomMetadata: { socketIds: string[] } = await this.__memcache.hgetall(opts.roomId) ?? { socketIds: [] };
        const socketIds = [ socket.id, ...roomMetadata.socketIds ];
        await this.__memcache.hset({ key: opts.roomId, value: socketIds });

        socket.join(socket.id);
        this.__zLog.info(`${socket.id} joined room --> ${opts.roomId}`);
      } catch (err) {
        this.__zLog.error(`error for socket ${socket.id}: ${NodeUtil.extractErrorMessage(err)}`);
        this.__io.to(socket.id).emit(EVENT_MAP.io.error, NodeUtil.extractErrorMessage(err));
        throw err;
      }
    });
  
    socket.on(EVENT_MAP.room.data, async (msg: BroadcastRoomData<T>) => { // emits to all socket ids mapped to a particular room in the request payload
      const { roomId, event, payload } = msg;
      try {
        const roomMetadata: { socketIds: string[] } = await this.__memcache.hgetall(roomId) ?? { socketIds: [] };

        const updateSocketPromises = roomMetadata.socketIds.map(async socketId => {
          try {
            const userMeta: Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'> = await this.__memcache.hgetall(socketId);
            if (! userMeta) throw new Error(`incoming user on socket with id ${socket.id} has been been registered on roomId ${msg.roomId}`)
            
            if (! ACLMiddleware.isEligible({ incoming: userMeta.role, expected: msg.role })) { // check access level for socket user
              this.__zLog.warn(`role is not eligble for message minimum role, filtering results for: ${socket.id}`);
            } else {
              this.__io.to(socketId).emit(event, payload); 
              return socketId;
            }
          } catch (err) {
            this.__zLog.error(`error validating socket: ${NodeUtil.extractErrorMessage(err)}`);
            await this.__leaveRoom({ socket, roomId })
              .catch(e => this.__zLog.error(`leave room err: ${NodeUtil.extractErrorMessage(e)}`));

            socket.disconnect();
            throw err;
          }
        })
        
        const updatedSocketIds: string[] = (await Promise.all(updateSocketPromises)).filter(el => el); // update eligible sockets and broadcast msgs in parallel
        await this.__memcache.hset({ key: roomId, value: updatedSocketIds });
      } catch (err) {
        this.__zLog.error(`socketId ${socket.id} err: ${NodeUtil.extractErrorMessage(err)}`);
        this.__io.to(socket.id).emit(EVENT_MAP.io.error, err.message);
        throw err;
      }
    });
  
    socket.on(EVENT_MAP.room.leave, async (roomId: string) => {
      try {
        const rootMeta: { socketIds: string[] } = await this.__memcache.hgetall(roomId) ?? { socketIds: [] };
        const socketIdIndex = rootMeta.socketIds.findIndex(id => id === socket.id);
        if (socketIdIndex === -1 || rootMeta.socketIds.length <= 1) {
          await this.__memcache.hdel(roomId); 
        } else {
          const updatedSocketIds = [ ...rootMeta.socketIds.slice(0, socketIdIndex), ...rootMeta.socketIds.slice(socketIdIndex + 1) ];
          await this.__memcache.hset({ key: roomId, value: updatedSocketIds });
        }

        this.__zLog.info(`${socket.id} left room --> ${roomId}`);
        socket.leave(socket.id);
      } catch (err) {
        this.__zLog.error(`socket leave error: ${NodeUtil.extractErrorMessage(err)}`);
        socket.disconnect();
      }
    });

    socket.on(EVENT_MAP.io.disconnect, () => {
      this.__zLog.debug(`socket with id ${socket.id} disconnected`);
    });
  }

  private async __setUserMeta(socket: BroadcastSocket): Promise<boolean> { // this is set to expire, use this to expire user auth so once logged in user is not always logged in
    return this.__memcache.hset({ key: socket.id, value: socket.user, expirationInSec: socket.exp });
  }

  private async __leaveRoom(opts: { socket: BroadcastSocket, roomId: string }) {
    try {
      const rootMeta: { socketIds: string[] } = await this.__memcache.hgetall(opts.roomId) ?? { socketIds: [] };
      const socketIdIndex = rootMeta.socketIds.findIndex(id => id === opts.socket.id);
      if (socketIdIndex === -1 || rootMeta.socketIds.length <= 1) {
        await this.__memcache.hdel(opts.roomId); 
      } else {
        const updatedSocketIds = [ ...rootMeta.socketIds.slice(0, socketIdIndex), ...rootMeta.socketIds.slice(socketIdIndex + 1) ];
        await this.__memcache.hset({ key: opts.roomId, value: updatedSocketIds });
      }

      this.__zLog.info(`${opts.socket.id} left room --> ${opts.roomId}`);
    } catch (err) {
      this.__zLog.error(`socket leave error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  private async __checkAuth(token: string): Promise<{ verified: boolean, payload: JWTVerifyPayload }> { // verify incoming auth token
    try {
      const payload = await this.__jwtMiddleware.verify(token);
      return { verified: true, payload };
    } catch (err) {
      this.__zLog.error(`verification error: ${NodeUtil.extractErrorMessage(err)}`);
      return { verified: false, payload: null };
    }
  }
}