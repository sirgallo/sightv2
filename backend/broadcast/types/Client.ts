export type Protocol = 'https' | 'wss';

export interface ClientOpts {
  token: string;
  conn?: { protocol: Protocol, endpoint: string, port?: number };
  keepAlive?: boolean;
}

export type SocketEndpoint<T extends 'https' | 'wss', V extends number = undefined> =
  V extends number
  ? `${T}://${string}`
  : V extends undefined
  ? `${T}://${string}:${number}`
  : never;