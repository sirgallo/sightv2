import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

import { serverConfigurations } from '../../ServerConfigurations.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { BackoffUtil } from '../../core/utils/Backoff.js';
import { envLoader } from '../../common/EnvLoader.js';
import { ClientOpts, Protocol, SocketEndpoint } from '../types/Client.js';
import { RoomEvent, BroadcastRoomConnect, BroadcastRoomData, EVENT_MAP, IOEvent, BroadcastEventListener } from '../types/Broadcast.js';


export abstract class ClientProvider {
  private __socket: Socket;
  private __endpoint: SocketEndpoint<Protocol>;
  private __roomMap: Map<string, BroadcastRoomConnect> = new Map();
  private __evtEmitter = new EventEmitter();
 
  constructor(protected opts: ClientOpts, protected zLog: LogProvider, private __backoffTimeout = 250) {
    this.__endpointResolver(this.opts.conn);
    this.__initialize();
  }

  get endpoint() { return this.__endpoint; }

  join(listenOpts: Pick<BroadcastRoomConnect, 'roomId' | 'roomType' | 'token'>) {
    const connectOpts: BroadcastRoomConnect = { ...listenOpts, db: this.opts.db };
    this.zLog.info(`attempt room join with: ${JSON.stringify(connectOpts, null, 2)}`);
    this.__socket.emit(EVENT_MAP.room.join, connectOpts);
    this.__roomMap.set(connectOpts.roomId, connectOpts);
  }

  on<EVT extends IOEvent | RoomEvent>(event: EVT, listener: BroadcastEventListener<EVT>) {
    return this.__evtEmitter.on(event, listener);
  }

  protected send<T>(msg: BroadcastRoomData<T>) {
    this.__socket.send('data', msg);
  }

  private __initialize() { 
    const path = `${serverConfigurations.broadcast.root}/socket.io/`;
    this.zLog.debug(`path: ${serverConfigurations.broadcast.root}, endpoint: ${this.__endpoint}`);

    this.__socket = io(this.__endpoint, {
      // path: '/socket.io/',
      transports: [ 'polling', 'websocket' ],
      secure: true,
      reconnection: true,
      rejectUnauthorized: false,
      auth: { token: this.opts.token },
      // host: envLoader.SIGHT_PLATFORM_ENDPOINT
    });

    this.__socket.on(EVENT_MAP.io.connect, () => {
      this.zLog.info(`connection to ${this.__endpoint} made successfully`);
      this.__evtEmitter.emit(EVENT_MAP.io.connect);
    });

    this.__socket.on(EVENT_MAP.io.connect_error, err => {
      if (! this.__socket.active) this.zLog.error(`socket err: ${NodeUtil.extractErrorMessage(err)}`);
      this.zLog.warn(`temporary socket failure, will reconnect shortly`);
    });

    this.__socket.on(EVENT_MAP.io.disconnect, (reason: Socket.DisconnectReason) => {
      this.zLog.info(`${EVENT_MAP.io.disconnect}:${this.__socket.id}`);
      this.zLog.debug(`reason: ${reason}`);
      if (this.opts.keepAlive) this.__socket.emit(EVENT_MAP.io.reconnect);
      this.__evtEmitter.emit(EVENT_MAP.io.disconnect, reason);
    });

    this.__socket.on(EVENT_MAP.io.refresh_token, (token: string) => {
      this.opts.token = token;
      this.__socket.auth = { token };
    })

    this.__socket.io.on(EVENT_MAP.io.reconnect_attempt, async attempt => {
      this.zLog.debug(`${EVENT_MAP.io.reconnect_attempt}, ${attempt}`);
      const timeout = BackoffUtil.strategy(attempt, this.__backoffTimeout);
      await NodeUtil.sleep(timeout);
    });
    
    this.__socket.io.on(EVENT_MAP.io.reconnect, () => {
      this.zLog.debug(`reconnect:${this.__socket.id}`);
    });

    this.__socket.io.on(EVENT_MAP.io.ping, () => {
      this.__socket.emit(EVENT_MAP.io.pong);
    });

    this.__socket.io.on(EVENT_MAP.io.error, err => {
      this.zLog.error(`error on client socket: ${NodeUtil.extractErrorMessage(err)}`);
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

