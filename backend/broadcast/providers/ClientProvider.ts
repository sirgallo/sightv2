import { io, Socket } from 'socket.io-client';

import { serverConfigurations } from '../../ServerConfigurations.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { BackoffUtil } from '../../core/utils/Backoff.js';
import { envLoader } from '../../common/EnvLoader.js';
import { ClientOpts, Protocol, SocketEndpoint } from '../types/Client.js';
import { RoomEvent, BroadcastRoomConnect, BroadcastRoomData, EVENT_MAP } from '../types/Broadcast.js';


export abstract class ClientProvider {
  private __socket: Socket;
  private __endpoint: SocketEndpoint<Protocol>;
 
  constructor(protected opts: ClientOpts, protected zLog: LogProvider, private __backoffTimeout = 250) {
    this.__endpointResolver(this.opts.conn);
    this.__initialize();
  }

  get endpoint() { return this.__endpoint; }

  listen(listenOpts: Pick<BroadcastRoomConnect, 'roomId' | 'roomType' | 'token'>) {
    this.__socket.on(EVENT_MAP.io.connect, () => {
      this.zLog.info(`connection to ${this.__endpoint} made successfully`);

      this.__socket.io.engine.once(EVENT_MAP.io.upgrade, () => {
        this.zLog.info(`upgraded transport layer: ${this.__socket.io.engine.transport.name}`); // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
      });

      const connectOpts: BroadcastRoomConnect = { ...listenOpts, db: this.opts.db };
      this.zLog.info(`attempt room join with: ${JSON.stringify(connectOpts, null, 2)}`);
      this.__socket.emit(EVENT_MAP.room.join, connectOpts);
    });

    this.__socket.on(EVENT_MAP.io.disconnect, (reason: Socket.DisconnectReason) => {
      this.zLog.info(`${EVENT_MAP.io.disconnect}:${this.__socket.id}`);
      this.zLog.debug(`reason: ${reason}`);
      if (this.opts.keepAlive) this.__socket.emit(EVENT_MAP.io.reconnect)
    });

    this.__socket.on(EVENT_MAP.io.refresh, (token: string) => {
      const connectOpts: BroadcastRoomConnect = { ...listenOpts, db: this.opts.db, token };
      this.__socket.emit(EVENT_MAP.room.leave);
      this.__socket.emit(EVENT_MAP.room.join, connectOpts);
    });

    this.__socket.io.on(EVENT_MAP.io.reconnect_attempt, async attempt => {
      this.zLog.debug(`${EVENT_MAP.io.reconnect_attempt}, ${attempt}`);
      const timeout = BackoffUtil.strategy(attempt, this.__backoffTimeout);
      await NodeUtil.sleep(timeout);
    });
    
    this.__socket.io.on(EVENT_MAP.io.reconnect, () => {
      this.zLog.debug(`reconnect:${this.__socket.id}`);
      const connectOpts: BroadcastRoomConnect = { ...listenOpts, db: this.opts.db };
      this.__socket.emit(EVENT_MAP.room.join, connectOpts);
    });

    this.__socket.io.on(EVENT_MAP.io.ping, () => {
      this.__socket.emit(EVENT_MAP.io.pong);
    });

    this.__socket.io.on(EVENT_MAP.io.error, err => {
      this.zLog.error(`error on client socket: ${NodeUtil.extractErrorMessage(err)}`);
    });
  }

  protected clientOn<T>(event: RoomEvent, listener: (msg: BroadcastRoomData<T>) => void) {
    this.__socket.emit(event, listener);
  }

  protected clientEmit<T>(event: RoomEvent, msg: BroadcastRoomData<T>) {
    this.__socket.emit(event, msg);
  }

  private __initialize() { 
    this.__socket = io(this.__endpoint, { 
      path: `${serverConfigurations.broadcast.root}/socket.io/`,
      withCredentials: true,
      auth: { token: this.opts.token }
    });

    this.zLog.info(`socket initialized on ${this.__endpoint} with path: ${serverConfigurations.broadcast.root}/socket.io/`);
  }

  private __endpointResolver = (opts?: { protocol: Protocol, endpoint: string, port?: number }) => {
    const { endpoint, port } = ((): { protocol: Protocol, endpoint: string, port?: number } => {
      if (opts) return opts;
      return { endpoint: envLoader.SIGHT_PLATFORM_ENDPOINT, protocol: 'https' };
    })();

    this.__endpoint = [ 
      `${opts.protocol}://${endpoint}`,
      port ? `:${port}` : null
    ].filter(el => el).join('') as SocketEndpoint<Protocol>;
  }
}

