import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { BackoffUtil } from '../../core/utils/Backoff.js';
import { envLoader } from '../../common/EnvLoader.js';
import { ClientOpts, Protocol, SocketEndpoint } from '../types/Client.js';
import { BroadcastRoomMessage, ServerClientEvents, ClientServerEvents, AcknowledgeFn } from '../types/Broadcast.js';


export class ClientProvider extends EventEmitter {
  private __socket: Socket<ServerClientEvents, ClientServerEvents>;
  private __endpoint: SocketEndpoint<Protocol>;
  private __roomMap: Map<string, BroadcastRoomMessage<any>> = new Map();
  private __keepAlive = true;
  constructor(protected opts: ClientOpts, private zLog: LogProvider, private __backoffTimeout = 250) {
    super();

    if (this.opts.keepAlive != null) this.__keepAlive = this.opts.keepAlive;
    this.__endpointResolver(this.opts.conn);
    this.__initialize();
  }

  get endpoint() { return this.__endpoint; }
  get socket() { return this.__socket; }

  ready(listener: (ready: boolean) => void) {
    const event: keyof ServerClientEvents = 'welcome';
    return super.on(event, listener);
  }

  join<T>(listenOpts: Pick<BroadcastRoomMessage<T>, 'roomId' | 'roomType' | 'role' | 'orgId'>) {
    const connectOpts: BroadcastRoomMessage<any> = { ...listenOpts, payload: null };
    this.zLog.info(`attempt room join with: ${JSON.stringify(connectOpts, null, 2)}`);
    
    this.__socket.emit('join_room', connectOpts);
    this.__roomMap.set(connectOpts.roomId, connectOpts);
  }

  sub(listener: <T>(msg: Pick<BroadcastRoomMessage<T>, 'roomId' | 'payload'>, ack: AcknowledgeFn) => void) {
    const event: keyof ServerClientEvents = 'sub_room';
    return super.on(event, listener);
  }

  private __initialize() { 
    this.zLog.debug(`client --> broadcast endpoint: ${this.__endpoint}`);

    this.__socket = io(this.__endpoint, {
      path: '/socket.io/',
      transports: [ 'polling', 'websocket' ],
      secure: true,
      rejectUnauthorized: false,
      query: { token: this.opts.token },
    });

    this.__socket.io.engine.on('open', () =>{
      this.zLog.info(`socket engine opened`);
    });

    this.__socket.on('connect', () => {
      this.zLog.info(`connection to ${this.__endpoint} made successfully`);
    });

    this.__socket.on('welcome', () => {
      this.zLog.info('server acknowledged socket, ready');
      super.emit('welcome');
    });

    this.__socket.on('sub_room', (msg, ack) => {
      super.emit('sub_room', msg, ack);
    })

    this.__socket.on('connect_error', err => {
      if (! this.__socket.active) this.zLog.error(`socket err: ${NodeUtil.extractErrorMessage(err)}`);
      this.zLog.warn(`temporary socket failure, will reconnect shortly`);
    });

    this.__socket.on('disconnect', (reason: string) => {
      this.zLog.info(`disconnect:${this.__socket.id}`);
      this.zLog.debug(`reason: ${reason}`);
      if (this.__keepAlive) this.__socket.connect()
    });

    this.__socket.on('err_room', (err: string) => {
      this.zLog.error(`room err: ${err}`);
    });

    this.__socket.on('refresh_token', (token: string, ack: AcknowledgeFn) => {
      this.opts.token = token;
      ack(token);
    });

    this.__socket.io.on('reconnect_attempt', async attempt => {
      this.zLog.debug(`reconnect_attempt:${attempt}`);
      const timeout = BackoffUtil.strategy(attempt, this.__backoffTimeout);
      await NodeUtil.sleep(timeout);
    });
    
    this.__socket.io.on('reconnect', () => {
      this.zLog.debug(`$reconnect:${this.__socket.id}`);
    });

    this.__socket.io.on('error', (err: Error) => {
      this.zLog.error(`error on client socket: ${err}`);
    });
  }

  private __endpointResolver = (opts?: { protocol: Protocol, endpoint: string, port?: number }) => {
    const { endpoint, protocol, port } = ((): { protocol: Protocol, endpoint: string, port?: number } => {
      if (opts) return opts;
      return { endpoint: envLoader.SIGHT_PLATFORM_ENDPOINT, protocol: 'https' };
    })();

    this.__endpoint = [ 
      `${protocol}://${endpoint}`,
      port ? `:${port}` : null
    ].filter(el => el).join('') as SocketEndpoint<Protocol>;
  }
}

