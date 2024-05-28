import { Server as HttpServer } from 'http';
import { Cluster } from 'ioredis';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-streams-adapter';

import { LogProvider } from '../../log/LogProvider.js';
import { RedisProvider } from '../../data/providers/RedisProvider.js';
import { JWTMiddleware, JWTVerifyPayload } from '../../middleware/JWTMiddleware.js';
import { ACLMiddleware } from '../../middleware/ACLMiddleware.js';
import { NodeUtil } from '../../utils/Node.js';
import { envLoader } from '../../../common/EnvLoader.js';
import { 
  BroadcastOpts, BroadcastRoomMessage, BroadcastSocket, RoomMetadata,
  ClientServerEvents, ServerClientEvents, ServerServerEvents 
} from '../types/Broadcast.js';
import { BroadcastMetadataProvider } from './BroadcastMetadataProvider.js';


export class BroadcastProvider {
  private __io: Server<ClientServerEvents, ServerClientEvents, ServerServerEvents>;
  private __client: Cluster;
  private __metadata: BroadcastMetadataProvider;
  private __jwtMiddleware = new JWTMiddleware({ 
    secret: envLoader.JWT_SECRET,
    timespanInSec: envLoader.JWT_TIMEOUT 
  });

  private __zLog = new LogProvider(BroadcastProvider.name);
  constructor(private __server: HttpServer, private __opts: BroadcastOpts) {
    this.__client = new RedisProvider().getCluster({ service: 'stream', db: 'broadcast_stream' });
    this.__metadata = new BroadcastMetadataProvider(this.__opts);
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

    this.__io.adapter(createAdapter(this.__client)); // create redis pub/sub adapter
    this.__io.use(async (socket: BroadcastSocket, next) => { // validate incoming request
      const token = socket.handshake.query.token as string; // set query args on handshake
      
      const { verified, payload } = await this.__checkAuth(token); // check incoming auth token
      if (! verified) return next(new Error('socket.io authentication error'));
      if (payload?.newToken) { 
        this.__io.to(socket.id).emit('broadcast:refresh', payload.newToken);
      }

      socket.user = payload.user;
      socket.exp = payload.exp; // set time to expire connection on socket
      
      console.log('socket user', socket.user, 'exp:', socket.exp);
      return next();
    });

    this.__io.on('connection', async (socket: BroadcastSocket) => {
      this.__zLog.info(`socket connection made with id ${socket.id}`);
      await socket.join(socket.user.userId);

      try {
        socket.on('room:join', async (msg, callback) => { // handle validated socket connections
          console.log('am I here?')
          try { // map the incoming socket id to the room - socket map and join the db
            const { roomId, orgId, roomType } = msg;
    
            // if (roomType === 'org' && orgId !== socket.user.orgId) throw new Error('incoming user is not in room organization');
            if (! ACLMiddleware.isEligible({ incoming: socket.user.role, expected: msg.role })) throw new Error('elevated privileges required to join room');
            
            await this.__metadata.setRoomMeta({ roomId, orgId, roomRole: msg.role, roomType, userIds: [ socket.user.userId ] }); // if room doesn't exist, make it
            //this.__zLog.info(`${socket.user.userId} joined room --> ${msg.roomId}`);

            this.__zLog.info(`${socket.user.userId} joined room --> ${roomId}`);
            this.__zLog.debug(`socket rooms: ${JSON.stringify(socket.rooms, null, 2)}`);
            callback(roomId);
          } catch (err) {
            this.__zLog.error(`join room err for socket ${socket.id}: ${NodeUtil.extractErrorMessage(err)}`);
            socket.emit('broadcast:err', NodeUtil.extractErrorMessage(err));
          }
        });
    
        socket.on('room:publish', async (msg, callback) => {
          console.log('publishing', msg);
          try { // map the incoming socket id to the room - socket map and join the db
            // const roomMeta = await this.__metadata.getRoomMeta(msg.roomId);
            // if (! roomMeta) throw new Error('room does not exist, cannot broadcast to non-existent room');
  
            // const isValidated = this.__validatePublisher(roomMeta, socket.user);
            // if (! isValidated) throw new Error('publisher not validated on room for broadcasting');
            
            // const updatedUserIds = await this.__broadcast({ userIds: roomMeta.userIds, msg });
            // await this.__metadata.setRoomMeta({ roomId: msg.roomId, ...roomMeta, userIds: updatedUserIds });
            callback(msg.roomId);
          } catch (err) {
            this.__zLog.error(`error for socket ${socket.id}: ${NodeUtil.extractErrorMessage(err)}`);
            socket.emit('broadcast:err', NodeUtil.extractErrorMessage(err));
            throw err;
          }
        });
    
        socket.on('room:leave', async (msg, callback) => { // socket leave room
          try {
            await this.__leaveRoom({ userId: socket.user.userId, roomId: msg.roomId });
            socket.leave(msg.roomId);
            callback(msg.roomId);
          } catch (err) {
            this.__zLog.error(`error for socket ${socket.id}: ${NodeUtil.extractErrorMessage(err)}`);
            throw err;
          }
        });
    
        socket.on('error', err => {
          this.__zLog.error(`socket with id ${socket.id} err: ${NodeUtil.extractErrorMessage(err)}`);
          socket.disconnect();
        });

        socket.on('disconnecting', reason => {
          this.__zLog.debug(`socket disconect for ${socket.id}: ${reason}`);
          
        });

        socket.emit('broadcast:welcome');
        // this.__socketMap.set(socket.user.userId, await this.__handleConnection(socket));
        this.__zLog.info(`socket listeners started`);
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

  /*
  private async __handleConnection(socket: BroadcastSocket) { // init incoming socket connections
    try {
      await this.__metadata.setUserMeta({ userMeta: socket.user, expiration: socket.exp });
      await socket.join(socket.user.userId);

      socket.on('room:join', async msg => { // handle validated socket connections
        console.log('here?')
        try { // map the incoming socket id to the room - socket map and join the db
          const { roomId, orgId, roomType } = msg;
  
          if (roomType === 'org' && roomId !== socket.user.orgId) throw new Error('incoming user is not in room organization');
          if (! ACLMiddleware.isEligible({ incoming: socket.user.role, expected: msg.role })) throw new Error('elevated privileges required to join room');
          
          await this.__metadata.setRoomMeta({ roomId, orgId, roomRole: msg.role, roomType, userIds: [ socket.user.userId ] }); // if room doesn't exist, make it
          this.__zLog.info(`${socket.user.userId} joined room --> ${msg.roomId}`);

          socket.emit('room:joined', msg.roomId);
        } catch (err) {
          this.__zLog.error(`join room err for socket ${socket.id}: ${NodeUtil.extractErrorMessage(err)}`);
          socket.emit('broadcast:err', NodeUtil.extractErrorMessage(err));
          throw err;
        }
      });
  
      socket.on( // broadcast data published by the socket to other sockets in the designated room
        'room:publish',
        async <T>({ roomId, payload }: Pick<BroadcastRoomMessage<T extends infer R ? R : never>, 'roomId' | 'payload'>) => {
          try { // map the incoming socket id to the room - socket map and join the db
            const roomMeta = await this.__metadata.getRoomMeta(roomId);
            if (! roomMeta) throw new Error('room does not exist, cannot broadcast to non-existent room');
  
            const isValidated = this.__validatePublisher(roomMeta, socket);
            if (! isValidated) throw new Error('publisher not validated on room for broadcasting');
            
            const updatedUserIds = await this.__broadcast({ userIds: roomMeta.userIds, msg: { roomId, payload } });
            await this.__metadata.setRoomMeta({ roomId, ...roomMeta, userIds: updatedUserIds });
            socket.emit('room:published');
          } catch (err) {
            this.__zLog.error(`error for socket ${socket.id}: ${NodeUtil.extractErrorMessage(err)}`);
            socket.emit('broadcast:err', NodeUtil.extractErrorMessage(err));
            throw err;
          }
        }
      );
  
      socket.on('room:leave', async ({ roomId }: Pick<BroadcastRoomMessage, 'roomId'>) => { // socket leave room
        try {
          await this.__leaveRoom({ userId: socket.user.userId, roomId });
          socket.emit('room:left', roomId);
        } catch (err) {
          this.__zLog.error(`error for socket ${socket.id}: ${NodeUtil.extractErrorMessage(err)}`);
          throw err;
        }
      });
  
      socket.on('error', err => {
        this.__zLog.error(`socket with id ${socket.id} err: ${NodeUtil.extractErrorMessage(err)}`);
        socket.disconnect();
      });

      socket.on('disconnect', reason => {
        this.__zLog.debug(`socket disconect for ${socket.id}: ${reason}`);
      });

      socket.emit('broadcast:welcome');
      return socket;
    } catch (err) {
      throw err;
    }
  }
  */

  private async __broadcast<T>({ userIds, msg }: { 
    userIds: string[],
    msg: Pick<BroadcastRoomMessage<T extends infer R ? R : never>, 'roomId' | 'payload'> 
  }): Promise<string[]> { // check eligibility of potential socket and broadcast if eligible
    try {
      const handleUserErr = async (userId: string) => {
        await this.__leaveRoom({ userId, roomId: msg.roomId })
        this.__io.to(userId).emit('broadcast:err', 'user metadata not registered, reauthenticate');
        return null
      }
      const broadcastPromises: Promise<string>[] = userIds.map(async userId => {
        try {
          const userMeta = await this.__metadata.getUserMeta(userId);
          if (! userMeta) throw new Error('user metadata not registered'); // this means user is no longer authenticated
  
          this.__io.to(userId).emit('room:msg', msg);

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
      const roomMeta: RoomMetadata = await this.__metadata.getRoomMeta(roomId);
      const socketIdIndex = roomMeta.userIds.findIndex(uid => uid === userId);
      
      if (socketIdIndex === -1 || roomMeta.userIds.length <= 1) {
        await this.__metadata.delRoomMeta(roomId); 
        this.__zLog.debug(`room ${roomId} is empty, removing from registry`);
      } else {
        const updatedSocketIds = [ ...roomMeta.userIds.slice(0, socketIdIndex), ...roomMeta.userIds.slice(socketIdIndex + 1) ];
        await this.__metadata.setRoomMeta({ roomId, ...roomMeta, userIds: updatedSocketIds });
        this.__zLog.debug(`${userId} left room --> ${roomId}`);
      }

      return true;
    } catch (err) {
      this.__zLog.error(`socket leave error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  private async __validatePublisher(roomMeta: RoomMetadata, user: BroadcastSocket['user']): Promise<boolean> {
    try {
      if (! roomMeta) throw new Error('cannot publish to non-existent room');
      if (! ACLMiddleware.isEligible({ incoming: user.role, expected: roomMeta.roomRole })) throw new Error('higher privileges needed to publish to room');
      if (roomMeta.roomType === 'org' && user.orgId !== roomMeta.orgId) throw new Error('publisher not verified on room');

      const userMeta = await this.__metadata.getRoomMeta(user.userId);
      if (! userMeta) throw new Error('user metadata does not exist for socket user, reconnect');

      return true;
    } catch(err) {
      this.__zLog.error(`message validation err: ${NodeUtil.extractErrorMessage(err)}`);
      return false;
    }
  }
}


const emitWithTimeout = async (
  io: Server,
  socketId: string,
  opts: { event: keyof ServerClientEvents, data: BroadcastRoomMessage, timeout?: number }
) => {
  return new Promise<string>((resolve, reject) => {
    const timer = (() => {
      if (! opts.timeout) return null;

      return setTimeout(() => {
      reject(new Error('acknowledgement timeout'));
    }, opts.timeout);
    })();

    io.to(socketId).emit(opts.event, opts.data, async (res: string[]) => {
      if (timer) clearTimeout(timer);
      console.log(res[0]);

      resolve(res[0]);
    });
  }).catch(e => {
    console.log('emit with timeout err', NodeUtil.extractErrorMessage(e));
    throw e;
  });
};