import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';
import { Socket } from 'socket.io';

import { IUser } from '../../../db/models/User.js';
import { UserRole } from '../../../db/models/ACL.js';


export interface BroadcastOpts {
  connOpts: { redis: RedisOptions } 
    | { nodes: ClusterNode[], cluster: ClusterOptions };
}

export type RoomType = 'user' | 'org';

export type BroadcastRoomMessage<T = unknown> = { 
  roomId: string;
  orgId: string;
  roomType: RoomType;
  role: UserRole;
  payload: T extends unknown ? undefined : T;
};


export type AcknowledgeFn = (ackMsg: string) => Promise<void>;
export interface ServerClientEvents {
  welcome: () => void;
  joined: (roomId: string) => void;
  left: (roomId: string) => void;
  published: () => void;
  msg: <T>(msg: Pick<BroadcastRoomMessage<T>, 'roomId' | 'payload'>) => void;
  refresh: (token: string) => void;
  err: (err: string) => void;
}

export interface ClientServerEvents {
  join: (msg: Pick<BroadcastRoomMessage, 'roomId' | 'orgId' | 'role' | 'roomType'>) => void;
  leave: (msg: Pick<BroadcastRoomMessage, 'roomId'>) => void;
  publish: <T>(msg: Pick<BroadcastRoomMessage<T>, 'roomId' | 'payload'>) => void;
}

export interface ServerServerEvents {
  ping: () => void;
}

export interface BroadcastSocket extends Socket<ClientServerEvents, ServerClientEvents> { // extend socket.io Socket with embedded user metadata
  user?: Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'>;
  exp?: number; // determine when to expire the socket connection based on jwt expiration
}

export interface RoomMetadata {
  orgId: string;
  roomRole: UserRole;
  roomType: RoomType;
  userIds: string[];
}