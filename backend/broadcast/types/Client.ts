import { MemcacheDb } from '../../core/data/types/Redis.js';
import { BroadcastEvent } from './Broadcast.js';


export type Protocol = 'https' | 'wss';

export interface ClientOpts {
  db: MemcacheDb;
  conn?: { protocol: Protocol, endpoint: string, port?: number };
  keepAlive?: boolean;
}

export interface SubscriberOpts extends ClientOpts {
  event: BroadcastEvent;
}

export type SocketEndpoint<T extends 'https' | 'wss', V extends number = undefined> =
  V extends number
  ? `${T}://${string}`
  : V extends undefined
  ? `${T}://${string}:${number}`
  : never;


export const pathSuffix = '/socket.io/';