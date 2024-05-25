import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';
 
import { MemcacheDb } from '../../core/data/types/Redis.js';
import { IUser } from '../../db/models/User.js';
import { UserRole } from '../../db/models/ACL.js';


export interface BroadcastOpts {
  connOpts: { redis: RedisOptions } 
    | { nodes: ClusterNode[], cluster: ClusterOptions };
}

export type RoomEvent = 
  'join' 
  | 'leave' 
  | 'data';

export type IOEvent = 
  'connect' 
  | 'connection'
  | 'error' 
  | 'reconnect_attempt' 
  | 'reconnect' 
  | 'disconnect' 
  | 'refresh'
  | 'upgrade'
  | 'ping'
  | 'pong';

export type JoinBroadcastRoomRequest = {
  token: string;
  room: string;
  user: Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'>;
}

export type RoomAccess = 'user' | 'org';

export interface BroadcastRoomConnect { 
  roomId: string;
  token: string;
  db: MemcacheDb;
  roomType: RoomAccess;
};

export type BroadcastRoomData<T> = { 
  roomId: string;
  event: RoomEvent;
  role: UserRole;
  payload: T;
};


export const EVENT_MAP: { room: { [evt in RoomEvent]: evt }, io: { [evt in IOEvent]: evt } } = {
  room: {
    join: 'join',
    leave: 'leave',
    data: 'data'
  },
  io: {
    connect: 'connect',
    connection: 'connection',
    error: 'error',
    reconnect_attempt: 'reconnect_attempt',
    reconnect: 'reconnect',
    disconnect: 'disconnect',
    refresh: 'refresh',
    upgrade: 'upgrade',
    ping: 'ping',
    pong: 'pong'
  }
};