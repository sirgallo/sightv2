import { io, Socket } from 'socket.io-client/debug';
import { EventEmitter } from 'events';

import { LogProvider } from '../../log/LogProvider.js';
import { NodeUtil } from '../../utils/Node.js';
import { envLoader } from '../../../common/EnvLoader.js';
import { ClientOpts, Protocol, SocketEndpoint } from '../types/Client.js';
import { BroadcastRoomMessage, ServerClientEvents, ClientServerEvents, AcknowledgeFn } from '../types/Broadcast.js';


export class ClientProvider extends EventEmitter<{ [evt in keyof ServerClientEvents]: Parameters<ServerClientEvents[evt]> }> {
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

  async join(joinOpts: Pick<BroadcastRoomMessage, 'roomId' | 'roomType' | 'role' | 'orgId'>) {
    this.zLog.info(`attempt room join with: ${JSON.stringify(joinOpts, null, 2)}`);

    return emitWithTimeout(this.__socket, 'room:join', joinOpts as BroadcastRoomMessage);
  }

  async leave(opts: Pick<BroadcastRoomMessage, 'roomId'>) {
    return emitWithTimeout(this.__socket, 'room:leave', opts as BroadcastRoomMessage);
  }

  async pub<T>(msg: Pick<BroadcastRoomMessage<T>, 'roomId' | 'payload'>) {
    return emitWithTimeout(this.__socket, 'room:publish', msg as BroadcastRoomMessage);
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

    this.__socket.on('connect', () => {
      this.zLog.info(`connection to ${this.__endpoint} made successfully`);
    });

    this.__socket.on('broadcast:welcome', () => {
      super.emit('broadcast:welcome');
    })

    this.__socket.on('room:msg', msg => {
      super.emit('room:msg', msg);
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

    this.__socket.on('broadcast:err', (err: string) => {
      this.zLog.error(`room err: ${err}`);
    });

    this.__socket.on('broadcast:refresh', (token: string) => {
      this.opts.token = token;
    });

    this.__socket.io.on('reconnect_attempt', async attempt => {
      this.zLog.debug(`reconnect_attempt:${attempt}`);
    });
    
    this.__socket.io.on('reconnect', () => {
      this.zLog.debug(`reconnect:${this.__socket.id}`);
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
  event: keyof ClientServerEvents,
  data: BroadcastRoomMessage,
  timeout?: number
) => {
  return new Promise<string>((resolve, reject) => {
    const timer = (() => {
      if (! timeout) return null;

      return setTimeout(() => {
      reject(new Error('acknowledgement timeout'));
    }, timeout);
    })();

    socket.emit(event, data, async ack => {
      if (timer) clearTimeout(timer);
      resolve(ack);
    });
  }).catch(e => {
    console.log('emit with timeout err', NodeUtil.extractErrorMessage(e));
    throw e;
  });
};