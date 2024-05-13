import { BroadcastDb } from '../../core/data/types/Redis.js';
import { BroadcastEvent, BroadcastOpts } from './Broadcast.js';


export type Protocol = 'https' | 'wss';

export interface ClientOpts extends BroadcastOpts {
  db: BroadcastDb;
  conn?: { protocol: Protocol, endpoint: string, port?: number };
  keepAlive?: boolean;
}

export interface SubscriberOpts extends ClientOpts {
  event: BroadcastEvent;
}

export type SocketEndpoint<T extends 'https' | 'wss', V extends number = undefined> =
  V extends number
  ? `${T}://${string}/socket.io/`
  : V extends undefined
  ? `${T}://${string}:${number}/socket.io/`
  : never;