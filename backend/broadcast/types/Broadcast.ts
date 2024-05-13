import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

import { BroadcastDb } from '../../core/data/types/Redis.js';
import { IUser } from '../../db/models/User.js';
import { UserRole } from '../../db/models/ACL.js';


export interface BroadcastOpts {
  connOpts: { redis: RedisOptions } 
    | { nodes: ClusterNode[], cluster: ClusterOptions };
}

export type BroadcastEvent = 'JOIN' | 'LEAVE' | 'DATA' | 'REFRESH' | 'ERROR';
export type ClientEvents = 'connection' | 'reconnect_attempt' | 'reconnect' | 'disconnect' | 'refresh';

export type JoinBroadcastRoomRequest<T extends BroadcastDb> = {
  token: string;
  room: T;
  user: Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'>;
}

export type RoomAccess = 'user' | 'org';

export interface BroadcastRoomConnect { 
  roomId: string;
  token: string;
  db: BroadcastDb;
  roomType: RoomAccess;
}

export type BroadcastRoomData<T> = { 
  roomId: string,
  event: BroadcastEvent,
  role: UserRole
  payload: T 
};


export const broadcastEventMap: { [evt in BroadcastEvent]: evt } = {
  JOIN: 'JOIN',
  LEAVE: 'LEAVE',
  DATA: 'DATA',
  REFRESH: 'REFRESH',
  ERROR: 'ERROR',
};

export const clientEventMap: { [evt in ClientEvents]: evt } = {
  connection: 'connection',
  reconnect_attempt: 'reconnect_attempt',
  reconnect: 'reconnect',
  disconnect: 'disconnect',
  refresh: 'refresh'
};