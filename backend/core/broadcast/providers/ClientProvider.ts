import { io, Socket } from 'socket.io-client/debug';
import { EventEmitter } from 'events';

import { LogProvider } from '../../log/LogProvider.js';
import { NodeUtil } from '../../utils/Node.js';
import { envLoader } from '../../../common/EnvLoader.js';
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

  ready(listener: () => void) {
    return super.on('welcome', listener);
  }

  join(listenOpts: Pick<BroadcastRoomMessage, 'roomId' | 'roomType' | 'role' | 'orgId'>, listener: (roomId: string) => void) {
    const data: BroadcastRoomMessage = { ...listenOpts, payload: null };
    this.zLog.info(`attempt room join with: ${JSON.stringify(data, null, 2)}`);

    this.__roomMap.set(listenOpts.roomId, data);
    const joined = super.on('joined', listener)
    this.socket.emit('join', data);
    return joined;
  }

  leave(opts: Pick<BroadcastRoomMessage, 'roomId'>) {
    this.__socket.emit('leave', opts as BroadcastRoomMessage);
  }

  pub<T>(msg: Pick<BroadcastRoomMessage<T>, 'roomId' | 'payload'>) {
    this.__socket.emit('publish', msg as BroadcastRoomMessage);
  }

  msg(listener: <T>(msg: Pick<BroadcastRoomMessage<T>, 'roomId' | 'payload'>, ack: AcknowledgeFn) => void) {
    return super.on('msg', listener);
  }

  err(listener: (err: string) => void) {
    return super.on('error', listener);
  }

  close() {
    this.__socket.disconnect();
  }

  private __initialize() { 
    this.zLog.debug(`client --> broadcast endpoint: ${this.__endpoint}`);

    this.__socket = io('https://battle-station-0', {
      path: '/socket.io/',
      transports: [ 'websocket' ],
      upgrade: true,
      secure: true,
      rejectUnauthorized: false,
      reconnectionDelay: 5000,
      query: { token: this.opts.token }
    });

    this.__socket.io.engine.on('open', () =>{
      this.zLog.info(`socket engine opened`);
    });

    this.__socket.on('connect', () => {
      this.zLog.info(`connection to ${this.__endpoint} made successfully`);
      super.emit('connect');
    });

    this.__socket.on('joined', roomId => {
      super.emit('joined', roomId);
    })

    this.__socket.on('left', roomId => {
      super.emit('left', roomId);
    })

    this.__socket.on('msg', msg => {
      super.emit('msg', msg);
    });

    this.__socket.on('connect_error', err => {
      if (! this.__socket.active) this.zLog.error(`socket err: ${NodeUtil.extractErrorMessage(err)}`);
      this.zLog.warn(`temporary socket failure, will reconnect shortly`);
    });

    this.__socket.on('disconnect', (reason: string) => {
      this.zLog.info(`disconnect:${this.__socket.id}`);
      this.zLog.debug(`reason: ${reason}`);
      if (this.__keepAlive) this.__socket.connect()
    });

    this.__socket.on('err', (err: string) => {
      this.zLog.error(`room err: ${err}`);
    });

    this.__socket.on('refresh', (token: string) => {
      this.opts.token = token;
    });

    this.__socket.io.on('reconnect_attempt', async attempt => {
      this.zLog.debug(`reconnect_attempt:${attempt}`);
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


const emitWithTimeout = async (
  socket: Socket<ServerClientEvents, ClientServerEvents>,
  opts: { event: keyof ClientServerEvents, data: BroadcastRoomMessage, timeout?: number }
) => {
  return new Promise<string>((resolve, reject) => {
    const timer = (() => {
      if (! opts.timeout) return null;

      return setTimeout(() => {
      reject(new Error('acknowledgement timeout'));
    }, opts.timeout);
    })();

    socket.emit(opts.event, opts.data);
  }).catch(e => {
    console.log('emit with timeout err', NodeUtil.extractErrorMessage(e));
    throw e;
  });
};