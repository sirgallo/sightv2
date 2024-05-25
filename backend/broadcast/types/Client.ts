import { MemcacheDb } from '../../core/data/types/Redis.js';
import { RoomEvent } from './Broadcast.js';


export type Protocol = 'https' | 'wss';

export interface ClientOpts {
  db: MemcacheDb;
  token: string;
  conn?: { protocol: Protocol, endpoint: string, port?: number };
  keepAlive?: boolean;
}

export interface SubscriberOpts extends ClientOpts {
  event: RoomEvent;
}

export type SocketEndpoint<T extends 'https' | 'wss', V extends number = undefined> =
  V extends number
  ? `${T}://${string}`
  : V extends undefined
  ? `${T}://${string}:${number}`
  : never;