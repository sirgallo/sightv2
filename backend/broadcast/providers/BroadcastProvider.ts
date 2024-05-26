import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-streams-adapter';

import { LogProvider } from '../../core/log/LogProvider.js';
import { JWTMiddleware, JWTVerifyPayload } from '../../core/middleware/JWTMiddleware.js';
import { ACLMiddleware } from '../../core/middleware/ACLMiddleware.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { MemcacheProvider } from '../../core/redis/providers/MemcacheProvider.js';
import { envLoader } from '../../common/EnvLoader.js';
import { IUser } from '../../db/models/User.js';
import { 
  BroadcastOpts, BroadcastRoomMessage, BroadcastSocket, RoomMetadata,
  ClientServerEvents, ServerClientEvents, ServerServerEvents 
} from '../types/Broadcast.js';


export class BroadcastProvider {
  private __io: Server<ClientServerEvents, ServerClientEvents, ServerServerEvents>;
  private __memcache: MemcacheProvider;
  private __jwtMiddleware = new JWTMiddleware({ 
    secret: envLoader.JWT_SECRET,
    timespanInSec: envLoader.JWT_TIMEOUT 
  });

  private __zLog = new LogProvider(BroadcastProvider.name);
  constructor(private __server: HttpServer, private __opts: BroadcastOpts) {
    this.__memcache = new MemcacheProvider({ db: 'room_cache', ...this.__opts }); // connect to redis memcache for underlying client
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

    this.__io.adapter(createAdapter(this.__memcache.client.duplicate())); // create redis pub/sub adapter
    this.__io.use(async (socket: BroadcastSocket, next) => { // validate incoming request
      const token = socket.handshake.query.token as string; // set query args on handshake
      
      const { verified, payload } = await this.__checkAuth(token); // check incoming auth token
      if (! verified) return next(new Error('socket.io authentication error'));
      if (payload?.newToken) { 
        this.__io.to(socket.id).emit('refresh_token', payload.newToken, () => {
          this.__zLog.debug('refresh acknowledged by client');
          socket.handshake.query.token = payload.newToken;
        });
      }

      socket.user = payload.user;
      socket.exp = payload.exp; // set time to expire connection on socket
      
      console.log('socket user', socket.user, 'exp:', socket.exp);
      return next();
    });

    this.__io.on('connection', async (socket: BroadcastSocket) => {
      try {
        this.__zLog.info(`socket connection made with id ${socket.id}`);
        await this.__handleConnection(socket);
      } catch(err) {
        this.__zLog.error(`connection error: ${NodeUtil.extractErrorMessage(err)}`);
        socket.disconnect();
        throw err;
      }
    });
  }

  private async __checkAuth(token: string): Promise<{ verified: boolean, payload: JWTVerifyPayload }> { // verify incoming auth token
    try {
      const payload = await this.__jwtMiddleware.verify(token); // use same middleware as express
      return { verified: true, payload };
    } catch (err) {
      this.__zLog.error(`verification error: ${NodeUtil.extractErrorMessage(err)}`);
      return { verified: false, payload: null };
    }
  }

  private async __handleConnection(socket: BroadcastSocket) { // init incoming socket connections
    socket.emit('welcome');

    await this.__setUserMeta(socket);
    socket.join(socket.user.userId); // make every user have a room, where messages can then be filtered from other rooms to the socket

    socket.on('join_room', async msg => { // handle validated socket connections
      try { // map the incoming socket id to the room - socket map and join the db
        const { roomId, orgId, roomType } = msg;

        if (roomType === 'org' && roomId !== socket.user.orgId) throw new Error('incoming user is not in room organization');
        if (! ACLMiddleware.isEligible({ incoming: socket.user.role, expected: msg.role })) throw new Error('elevated privileges required to join room');
        
        await this.__setRoomMeta({ roomId, orgId, roomRole: msg.role, roomType, userIds: [ socket.user.userId ] }); // if room doesn't exist, make it

        this.__zLog.info(`${socket.id} joined room --> ${msg.roomId}`);
      } catch (err) {
        this.__zLog.error(`join room err for socket ${socket.id}: ${NodeUtil.extractErrorMessage(err)}`);
        this.__io.to(socket.id).emit('err_room', NodeUtil.extractErrorMessage(err));
        throw err;
      }
    });

    socket.on( // broadcast data published by the socket to other sockets in the designated room
      'pub_room',
      async <T>({ roomId, payload }: Pick<BroadcastRoomMessage<T extends infer R ? R : never>, 'roomId' | 'payload'>) => {
        try { // map the incoming socket id to the room - socket map and join the db
          const roomMeta = await this.__getRoomMeta(roomId);
          if (! roomMeta) throw new Error('room does not exist, cannot broadcast to non-existent room');

          const isValidated = this.__validatePublisher(roomMeta, socket);
          if (! isValidated) throw new Error('publisher not validated on room for broadcasting');
          
          const updatedUserIds = await this.__broadcast({ userIds: roomMeta.userIds, msg: { roomId, payload } });
          await this.__setRoomMeta({ roomId, ...roomMeta, userIds: updatedUserIds })
        } catch (err) {
          this.__zLog.error(`error for socket ${socket.id}: ${NodeUtil.extractErrorMessage(err)}`);
          this.__io.to(socket.id).emit('err_room', NodeUtil.extractErrorMessage(err));
          throw err;
        }
      }
    );

    socket.on('leave_room', async ({ roomId }: Pick<BroadcastRoomMessage, 'roomId'>) => { // socket leave room
      try {
        await this.__leaveRoom({ userId: socket.user.userId, roomId });
        socket.leave(roomId);
      } catch (err) {
        this.__zLog.error(`error for socket ${socket.id}: ${NodeUtil.extractErrorMessage(err)}`);
        throw err;
      }
    });

    socket.on('error', err => {
      this.__zLog.error(`socket with id ${socket.id} err: ${NodeUtil.extractErrorMessage(err)}`);
      socket.disconnect();
    })

    socket.on('disconnect', () => {
      this.__zLog.debug(`socket with id ${socket.id} disconnected`);
    });
  }

  private async __broadcast<T>({ userIds, msg }: { 
    userIds: string[],
    msg: Pick<BroadcastRoomMessage<T extends infer R ? R : never>, 'roomId' | 'payload'> 
  }): Promise<string[]> { // check eligibility of potential socket and broadcast if eligible
    try {
      const handleUserErr = async (userId: string) => {
        await this.__leaveRoom({ userId, roomId: msg.roomId })
        this.__io.to(userId).emit('err_room', 'user metadata not registered, reauthenticate');
        return null
      }
      const broadcastPromises: Promise<string>[] = userIds.map(async userId => {
        try {
          const userMeta = await this.__getUserMeta(userId);
          if (! userMeta) throw new Error('user metadata not registered'); // this means user is no longer authenticated
  
          this.__io.to(userId).emit('sub_room', msg, ack => {
            this.__zLog.debug(`broadcast to acknowledged: ${ack}`)
          });

          return userId;
        } catch(err) {
          this.__zLog.error(`emit to ${userId} err: ${NodeUtil.extractErrorMessage(err)}`);
          return handleUserErr(userId);
        } 
      });

      return (await Promise.all(broadcastPromises)).filter(el => el); // broadcast in parallel
    } catch (err) {
      this.__zLog.error(`error validating socket: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  private async __leaveRoom({ userId, roomId }: { userId: string, roomId: string }): Promise<boolean> { // remove a socket from a room
    try {
      const roomMeta: RoomMetadata = await this.__getRoomMeta(roomId);
      const socketIdIndex = roomMeta.userIds.findIndex(uid => uid === userId);
      
      if (socketIdIndex === -1 || roomMeta.userIds.length <= 1) {
        await this.__memcache.hdel(roomId); 
        this.__zLog.debug(`room ${roomId} is empty, removing from registry`);
      } else {
        const updatedSocketIds = [ ...roomMeta.userIds.slice(0, socketIdIndex), ...roomMeta.userIds.slice(socketIdIndex + 1) ];
        await this.__memcache.hset({ key: roomId, value: { ...roomMeta, userIds: updatedSocketIds }});
        this.__zLog.debug(`${userId} left room --> ${roomId}`);
      }

      return true;
    } catch (err) {
      this.__zLog.error(`socket leave error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  private async __validatePublisher(roomMeta: RoomMetadata, socket: BroadcastSocket): Promise<boolean> {
    try {
      if (! roomMeta) throw new Error('cannot publish to non-existent room');
      if (! ACLMiddleware.isEligible({ incoming: socket.user.role, expected: roomMeta.roomRole })) throw new Error('higher privileges needed to publish to room');
      if (roomMeta.roomType === 'org' && socket.user.orgId !== roomMeta.orgId) throw new Error('publisher not verified on room');

      const userMeta = await this.__getUserMeta(socket.user.userId);
      if (! userMeta) {
        socket.disconnect();
        throw new Error('user metadata does not exist for socket user, reconnect');
      }

      return true;
    } catch(err) {
      this.__zLog.error(`message validation err: ${NodeUtil.extractErrorMessage(err)}`);
      return false;
    }
  }

  private async __getRoomMeta(roomId: string): Promise<RoomMetadata> {
    return this.__memcache.hgetall(roomId);
  }

  private async __setRoomMeta({ roomId, orgId, roomRole, roomType, userIds }: { roomId: string } & RoomMetadata) {
    const value = await (async (): Promise<RoomMetadata> => {
      const roomMeta = await this.__getRoomMeta(roomId);
      if (! roomMeta) return { roomRole, orgId, roomType, userIds };
      
      const userSet = new Set([ ...userIds, ...roomMeta.userIds  ])
      return { ...roomMeta, userIds: [ ...userSet  ] }
    })();

    await this.__memcache.hset({ key: roomId, value });
    return true;
  }

  private async __getUserMeta(userId: string): Promise<Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'>> {
    return this.__memcache.hgetall(userId);
  }

  private async __setUserMeta(socket: BroadcastSocket): Promise<boolean> {
    return this.__memcache.hset({ key: socket.user.userId, value: socket.user, expirationInSec: socket.exp }); // this is set to expire, use this to expire user auth so once logged in user is not always logged in
  }
}