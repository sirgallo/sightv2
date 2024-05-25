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
import { BroadcastOpts, BroadcastRoomConnect, BroadcastRoomData, EVENT_MAP } from '../types/Broadcast.js';


export class BroadcastProvider {
  private __io: Server;
  private __memcache: MemcacheProvider;
  private __jwtMiddleware = new JWTMiddleware({ secret: envLoader.JWT_SECRET, timespanInSec: envLoader.JWT_TIMEOUT });
  private __zLog = new LogProvider(BroadcastProvider.name);

  constructor(private __server: HttpServer, private __opts: BroadcastOpts) {
    this.__memcache = new MemcacheProvider({ db: 'room_cache', expirationInSec: envLoader.JWT_TIMEOUT, ...this.__opts }); // connect to redis memcache
    this.__initialize();
  }

  private __initialize() {  
    const origin = `https://${envLoader.SIGHT_PLATFORM_ENDPOINT}`;
    this.__zLog.info(`origin: ${origin}`);
    
    this.__io = new Server(this.__server, { 
      path: `${serverConfigurations.broadcast.root}/socket.io/`, 
      pingInterval: 20000, 
      pingTimeout: 60000, 
      allowUpgrades: true, 
      transports: [ 'polling', 'websocket' ],
      cors: { 
        origin, 
        methods: [ 'GET', 'POST' ],
        credentials: true
      }
    });

    this.__io.adapter(createAdapter(this.__memcache.client.duplicate(), this.__memcache.client.duplicate()));

    this.__io.use(async (socket, next) => {
      const token = socket.handshake.auth.token; // set auth args on handshake
      
      const { verified, payload } = await this.checkAuth(token); // check incoming auth token
      if (payload?.newToken) this.__io.to(socket.id).emit(EVENT_MAP.io.refresh, payload.newToken);

      if (! verified) return next(new Error('socket.io authentication error'));
      return next();
    });

    this.__io.on('connection', socket => {
      this.__zLog.info(`socket connection made with id ${socket.id}`);
      this.__handleConnection(socket);
    });

    this.__io.on('error', err => {
      this.__zLog.error(`io error: ${NodeUtil.extractErrorMessage(err)}`);
    });
  }

  private async __handleConnection<T>(socket: Socket) {
    socket.on(EVENT_MAP.room.join, async (opts: BroadcastRoomConnect) => {
      try { // map the incoming socket id to the room - socket map and join the db
        const { verified, payload } = await this.checkAuth(opts.token); // check incoming auth token
        if (! verified) throw new Error('incoming user connection did not pass auth verification');
        if (opts.roomType === 'org' && opts.roomId !== payload.user.orgId) throw new Error('incoming user is not in room organization');

        const token = (() => {
          if (! payload.newToken) return opts.token;
          this.__io.to(socket.id).emit(EVENT_MAP.io.refresh, payload.newToken);
          return payload.newToken;
        })();

        const userMeta = { ...payload.user, token };
        await this.__memcache.hset({ key: socket.id, value: userMeta, expire: true }); // this is set to expire, use this to expire user auth so once logged in user is not always logged in

        const roomMetadata: { socketIds: string[] } = await this.__memcache.hgetall(opts.roomId) ?? { socketIds: [] };
        const socketIds = [ socket.id, ...roomMetadata.socketIds ];
        await this.__memcache.hset({ key: opts.roomId, value: socketIds })

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
        const updatedSocketIds: string[] = (await Promise.all(
          roomMetadata.socketIds.map(async socketId => {
            try {
              const userMeta: Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'> & { token: string } = await this.__memcache.hgetall(socketId);
              if (! userMeta) {  
                this.__io.to(socketId).emit(EVENT_MAP.io.error, `user metadata does not exist for socket id: ${socket.id}`);
                return null;
              } 
              
              const authPayload = await this.checkAuth(userMeta.token);
              if (! authPayload.verified) {
                this.__zLog.warn(`token did not pass verification, ${socketId} leaving room ${roomId}`);
                this.__io.to(socketId).emit(EVENT_MAP.room.leave, roomId);
              } else if (! ACLMiddleware.isEligible({ incoming: userMeta.role, expected: msg.role })) {
                this.__zLog.warn(`role is not eligble for message minimum role, filtering results for: ${socket.id}`);
              } else { 
                const newToken = authPayload.payload.newToken;
                if (newToken) this.__io.to(socketId).emit(EVENT_MAP.io.refresh, newToken);

                this.__io.to(socketId).emit(event, payload); 
                return socketId;
              }
            } catch (err) {
              this.__zLog.error(`error validating socket: ${NodeUtil.extractErrorMessage(err)}`);
              throw err;
            }
          })
        )).filter(el => el);

        await this.__memcache.hset({ key: roomId, value: updatedSocketIds });
      } catch (err) {
        this.__zLog.error(`socketId ${socket.id} err: ${NodeUtil.extractErrorMessage(err)}`);
        this.__io.to(socket.id).emit(EVENT_MAP.room.leave, roomId);
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

    socket.on('disconnect', () => {
      this.__zLog.debug(`socket with id ${socket.id} disconnected`);
    });
  }

  private async checkAuth(token: string): Promise<{ verified: boolean, payload: JWTVerifyPayload }> { // verify incoming auth token
    try {
      const payload = await this.__jwtMiddleware.verify(token);
      return { verified: true, payload };
    } catch (err) {
      this.__zLog.error(`verification error: ${NodeUtil.extractErrorMessage(err)}`);
      return { verified: false, payload: null };
    }
  }
}

/*
  Broadcast:

    The Broadcast service aims to be scalable

*/