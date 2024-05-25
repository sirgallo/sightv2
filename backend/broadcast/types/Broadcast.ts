import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';
 
import { MemcacheDb } from '../../core/data/types/Redis.js';
import { IUser } from '../../db/models/User.js';
import { UserRole } from '../../db/models/ACL.js';
import { Socket } from 'socket.io';


export interface BroadcastSocket extends Socket {
  user?: Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'>; // inject user object
  exp?: number; // auth expiration before refresh required
}

export interface BroadcastOpts {
  connOpts: { redis: RedisOptions } 
    | { nodes: ClusterNode[], cluster: ClusterOptions };
}

export type RoomEvent = 
  'join' 
  | 'joined'
  | 'leave'
  | 'left'
  | 'data';

export type IOEvent = 
  'connect' 
  | 'connection'
  | 'connect_error'
  | 'error' 
  | 'reconnect_attempt' 
  | 'reconnect' 
  | 'disconnect' 
  | 'refresh_token'
  | 'upgrade'
  | 'ping'
  | 'pong';

export type BroadcastEventListener<T extends IOEvent | RoomEvent> = 
  T extends IOEvent
  ? (msg: BroadcastRoomData<T>) => void
  : T extends RoomEvent
  ? (data?: any) => void
  : never;

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
    joined: 'joined',
    leave: 'leave',
    left: 'left',
    data: 'data'
  },
  io: {
    connect: 'connect',
    connection: 'connection',
    connect_error: 'connect_error',
    error: 'error',
    reconnect_attempt: 'reconnect_attempt',
    reconnect: 'reconnect',
    refresh_token: 'refresh_token',
    disconnect: 'disconnect',
    upgrade: 'upgrade',
    ping: 'ping',
    pong: 'pong'
  }
};