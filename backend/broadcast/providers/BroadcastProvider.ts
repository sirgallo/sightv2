import { Server as HttpServer } from 'http';
import { NextFunction, Request, Response } from 'express';
import { hostname } from 'os';
import { join } from 'path';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

import { LogProvider } from '../../core/log/LogProvider.js';
import { JWTMiddleware, JWTVerifyPayload } from '../../core/middleware/JWTMiddleware.js';
import { ACLMiddleware } from '../../core/middleware/ACLMiddleware.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { MemcacheProvider } from '../../core/redis/providers/MemcacheProvider.js';
import { serverConfigurations } from '../../ServerConfigurations.js';
import { envLoader } from '../../common/EnvLoader.js';
import { IUser } from '../../db/models/User.js';
import { BroadcastOpts, BroadcastRoomConnect, BroadcastRoomData, broadcastEventMap } from '../types/Broadcast.js';
import { pathSuffix } from '../types/Client.js';


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
    const path = join(serverConfigurations.broadcast.root, pathSuffix);
    this.__zLog.info(`path for websocket server: ${path}`);
    
    this.__io = new Server({ 
      path, 
      pingInterval: 20000, 
      pingTimeout: 60000, 
      allowUpgrades: true, 
      transports: [ 'polling', 'websocket' ],
      cors: { 
        origin, 
        methods: [ 'GET', 'POST' ],
        credentials: true
      },
      cookie: {
        name: hostname(),
        httpOnly: true,
        sameSite: true,
        maxAge: 86400
      }
    });

    this.__io.listen(this.__server);
    this.__io.adapter(createAdapter(this.__memcache.client.duplicate(), this.__memcache.client.duplicate()));
    this.__io.on('connection', socket => {
      this.__zLog.info(`socket connection made with id ${socket.id}`);
      this.__handleConnection(socket);
    });

    this.__io.on('error', err => {
      this.__zLog.error(`io error: ${NodeUtil.extractErrorMessage(err)}`);
    });
    
    this.__io.engine.use(async (req: Request & { _query?: { sid?: any } & any }, res: Response, next: NextFunction) => {
      try {
        this.__zLog.info(`request in middleware: ${JSON.stringify(req, null, 2)}`);
        const isHandshake = req._query.sid === undefined;
        if (isHandshake) await this.__jwtMiddleware.authenticate(req, res, next);
        else next();
      } catch(err) {
        this.__zLog.error(`middleware err: ${NodeUtil.extractErrorMessage(err)}`);
        throw err;
      }
    });
  }

  private async __handleConnection<T>(socket: Socket) {
    socket.on(broadcastEventMap.JOIN, async (opts: BroadcastRoomConnect) => {
      try { // map the incoming socket id to the room - socket map and join the db
        const { verified, payload } = await this.checkAuth(opts.token); // check incoming auth token
        if (! verified) throw new Error('incoming user connection did not pass auth verification');
        if (opts.roomType === 'org' && opts.roomId !== payload.user.orgId) throw new Error('incoming user is not in room organization');

        const token = (() => {
          if (! payload.newToken) return opts.token;
          this.__io.to(socket.id).emit(broadcastEventMap.REFRESH, payload.newToken);
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
        throw err;
      }
    });
  
    socket.on(broadcastEventMap.DATA, async (msg: BroadcastRoomData<T>) => { // emits to all socket ids mapped to a particular room in the request payload
      const { roomId, event, payload } = msg;
      try {
        const roomMetadata: { socketIds: string[] } = await this.__memcache.hgetall(roomId) ?? { socketIds: [] };

        const updatedSocketIds: string[] = (await Promise.all(roomMetadata.socketIds.map(async socketId => {
          try {
            const userMeta: Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'> & { token: string } = await this.__memcache.hgetall(socketId);
            if (! userMeta) {  
              this.__io.to(socketId).emit(broadcastEventMap.ERROR, `user metadata does not exist for socket id: ${socket.id}`);
              return null;
            } 
            
            const authPayload = await this.checkAuth(userMeta.token);
            if (! authPayload.verified) {
              this.__zLog.warn(`token did not pass verification, ${socketId} leaving room ${roomId}`);
              this.__io.to(socketId).emit(broadcastEventMap.LEAVE, roomId);
            } else if (! ACLMiddleware.isEligible({ incoming: userMeta.role, expected: msg.role })) {
              this.__zLog.warn(`role is not eligble for message minimum role, filtering results for: ${socket.id}`);
            } else { 
              const newToken = authPayload.payload.newToken;
              if (newToken) this.__io.to(socketId).emit(broadcastEventMap.REFRESH, newToken);
  
              this.__io.to(socketId).emit(event, payload); 
              return socketId;
            }
          } catch (err) {
            this.__zLog.error(`error validating socket: ${NodeUtil.extractErrorMessage(err)}`);
            throw err;
          }
        }))).filter(el => el);

        await this.__memcache.hset({ key: roomId, value: updatedSocketIds });
      } catch (err) {
        this.__zLog.error(`socketId ${socket.id} err: ${NodeUtil.extractErrorMessage(err)}`);
        this.__io.to(socket.id).emit(broadcastEventMap.LEAVE, roomId);
        throw err;
      }
    });
  
    socket.on(broadcastEventMap.LEAVE, async (roomId: string) => {
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