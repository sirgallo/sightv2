import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

import { LogProvider } from '../../core/log/LogProvider.js';
import { JWTMiddleware, JWTVerifyPayload } from '../../core/middleware/JWTMiddleware.js';
import { ACLMiddleware } from '../../core/middleware/ACLMiddleware.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { BroadcastDb, broadcastDbs } from '../../core/data/types/Redis.js';
import { MemcacheProvider } from '../../core/data/providers/MemcacheProvider.js';
import { socketConfigurations } from '../../ServerConfigurations.js';
import { envLoader } from '../../common/EnvLoader.js';
import { IUser } from '../../db/models/User.js';
import { BroadcastOpts, BroadcastRoomConnect, BroadcastRoomData, broadcastEventMap } from '../types/Broadcast.js';


export class BroadcastProvider {
  private __memcache: MemcacheProvider;
  private __connectorMap: Map<BroadcastDb, Server> = new Map();
  private __jwtMiddleware = new JWTMiddleware({ secret: envLoader.JWT_SECRET, timespanInSec: envLoader.JWT_TIMEOUT });
  private __zLog = new LogProvider(BroadcastProvider.name);

  constructor(opts: BroadcastOpts) {
    this.initialize(opts);
  }

  listen() { // for each connector, listen for new socket connections and determine how to add to rooms
    this.__connectorMap.forEach((io: Server, db: BroadcastDb) => {
      io.listen(socketConfigurations.broadcast[db]);
      io.on('connection', socket => this.handleConnection(socket, db));
      this.__zLog.info(`listening for connections on db: ${db}`);
    });
  }

  private initialize(opts: BroadcastOpts) {
    for (const db of broadcastDbs) { // for each db start a listener, both pub sub on redis and socket
      this.__memcache = new MemcacheProvider({ db: 'room_cache', expirationInSec: envLoader.JWT_TIMEOUT, ...opts });
      this.__connectorMap.set(db, new Server({ adapter: createAdapter(this.__memcache.client, this.__memcache.client.duplicate()) }));
      this.__zLog.info(`${db} --> initialized`)
    }
  }

  private handleConnection<T extends BroadcastDb>(socket: Socket, db: T) {
    socket.on(broadcastEventMap.JOIN, async (opts: BroadcastRoomConnect) => {
      try { // map the incoming socket id to the room - socket map and join the db
        const { verified, payload } = await this.checkAuth(opts.token); // check incoming auth token
        if (! verified) throw new Error('incoming user connection did not pass auth verification');
        if (opts.roomType === 'org' && opts.roomId !== payload.user.orgId) throw new Error('incoming user is not in room organization');

        const token = (() => {
          if (! payload.newToken) return opts.token;
          socket.emit(broadcastEventMap.REFRESH, payload.newToken);
          return payload.newToken;
        })();

        const userMeta = { ...payload.user, token };
        await this.__memcache.hset({ key: socket.id, value: userMeta, expire: true }); // this is set to expire, use this to expire user auth so once logged in user is not always logged in

        const roomMetadata: { socketIds: string[] } = await this.__memcache.hgetall(opts.roomId) ?? { socketIds: [] };
        const socketIds = [ socket.id, ...roomMetadata.socketIds ];
        await this.__memcache.hset({ key: opts.roomId, value: socketIds })

        socket.join(db);
      } catch (err) {
        socket.emit(broadcastEventMap.ERROR, opts.roomId, `authentication failed for socket id: ${socket.id}`);
        throw err;
      }
    });
  
    socket.on(broadcastEventMap.DATA, async (msg: BroadcastRoomData<T>) => { // emits to all socket ids mapped to a particular room in the request payload
      const { roomId, event, payload } = msg;
      try {
        const roomMetadata: { socketIds: string[] } = await this.__memcache.hgetall(roomId) ?? { socketIds: [] };
        
        const updatedSocketIds: string[] = [];
        for (const socketId of roomMetadata.socketIds) { 
          const userMeta: Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'> & { token: string } = await this.__memcache.hgetall(socketId);
          if (! userMeta) {  
            socket.to(socketId).emit(broadcastEventMap.ERROR, `user metadata does not exist for socket id: ${socket.id}`);
            continue;
          } 
          
          const authPayload = await this.checkAuth(userMeta.token);
          if (! authPayload.verified) {
            socket.to(socketId).emit(broadcastEventMap.ERROR, roomId, `supplied token failed verification: ${socket.id}`);
          } else if (! ACLMiddleware.isEligible({ incoming: userMeta.role, expected: msg.role })) {
            socket.to(socketId).emit(broadcastEventMap.ERROR, roomId, `role is not eligble for message minimum role, filtering results for: ${socket.id}`);
          } else { 
            const newToken = authPayload.payload.newToken;
            if (newToken) socket.to(socketId).emit(broadcastEventMap.REFRESH, newToken);

            socket.to(socketId).emit(event, payload); 
            updatedSocketIds.push(socketId);
          }
        }

        await this.__memcache.hset({ key: roomId, value: updatedSocketIds });
      } catch (err) {
        socket.emit(broadcastEventMap.ERROR, roomId, `socket data error for socket id: ${socket.id}`);
        throw err;
      }
    });

    socket.on(broadcastEventMap.ERROR, (roomId: string, errMsg: string) => { // handle all socket level errors here and leave the room on error
      this.__zLog.error(`socket error: ${errMsg}`);
      socket.emit(broadcastEventMap.LEAVE, roomId);
    });
  
    socket.on(broadcastEventMap.LEAVE, async (roomId: string) => {
      try {
        const rootMeta: { socketIds: string[] } = await this.__memcache.hgetall(roomId) ?? { socketIds: [] };
        const socketIdIndex = rootMeta.socketIds.findIndex(id => id === socket.id);
        if (socketIdIndex !== -1) {
          if (rootMeta.socketIds.length <= 1) { 
            await this.__memcache.hdel(roomId); 
          } else {
            const updatedSocketIds = [ ...rootMeta.socketIds.slice(0, socketIdIndex), ...rootMeta.socketIds.slice(socketIdIndex + 1) ];
            await this.__memcache.hset({ key: roomId, value: updatedSocketIds });
          }
        } else { await this.__memcache.hdel(roomId); }
      } catch (err) {
        this.__zLog.error(`socket leave error: ${NodeUtil.extractErrorMessage(err)}`);
        socket.disconnect();
      }
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