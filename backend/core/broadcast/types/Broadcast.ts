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
  'broadcast:welcome': () => void;
  'broadcast:refresh': (token: string) => void;
  'broadcast:err': (err: string) => void;

  'room:joined': (roomId: string) => void;
  'room:left': (roomId: string) => void;
  'room:published': () => void;
  'room:msg': <T>(msg: Pick<BroadcastRoomMessage<T>, 'roomId' | 'payload'>) => void;
}

export interface ClientServerEvents {
  'room:join': (msg: Pick<BroadcastRoomMessage, 'roomId' | 'orgId' | 'role' | 'roomType'>, ack: AcknowledgeFn) => void;
  'room:leave': (msg: Pick<BroadcastRoomMessage, 'roomId'>, ack: AcknowledgeFn) => void;
  'room:publish': <T>(msg: Pick<BroadcastRoomMessage<T>, 'roomId' | 'payload'>, ack: AcknowledgeFn) => void;
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