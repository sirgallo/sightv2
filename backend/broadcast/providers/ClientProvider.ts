import { io, Socket } from 'socket.io-client';

import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { BackoffUtil } from '../../core/utils/Backoff.js';
import { envLoader } from '../../common/EnvLoader.js';
import { ClientOpts, Protocol, SocketEndpoint } from '../types/Client.js';
import { BroadcastEvent, broadcastEventMap, BroadcastRoomConnect, BroadcastRoomData, clientEventMap } from '../types/Broadcast.js';


export abstract class ClientProvider {
  private __socket: Socket;
  private __endpoint: SocketEndpoint<Protocol>;

  constructor(protected opts: ClientOpts, protected zLog: LogProvider, private backoffTimeout = 250) {
    this.endpointResolver(this.opts.conn);
    this.initialize();
  }

  get endpoint() { return this.__endpoint; }

  private initialize() { 
    this.__socket = io(this.__endpoint);
  }

  protected listen(listenOpts: Pick<BroadcastRoomConnect, 'roomId' | 'roomType' | 'token'>) {
    this.__socket.on(clientEventMap.connection, (socket: Socket) => { 
      const connectOpts: BroadcastRoomConnect = { ...listenOpts, db: this.opts.db };
      socket.emit(broadcastEventMap.JOIN, connectOpts);
    });

    this.__socket.on(broadcastEventMap.REFRESH, (token: string) => {
      const connectOpts: BroadcastRoomConnect = { ...listenOpts, db: this.opts.db, token };

      this.__socket.emit(broadcastEventMap.LEAVE);
      this.__socket.emit(broadcastEventMap.JOIN, connectOpts);
    });

    this.__socket.io.on(clientEventMap.reconnect_attempt, async attempt => {
      this.zLog.debug(`${clientEventMap.reconnect_attempt}, ${attempt}`);
      
      const timeout = BackoffUtil.strategy(attempt, this.backoffTimeout);
      await NodeUtil.sleep(timeout);
    });
    
    this.__socket.io.on(clientEventMap.reconnect, () => {
      this.zLog.debug(`reconnect:${this.__socket.id}`);

      const connectOpts: BroadcastRoomConnect = { ...listenOpts, db: this.opts.db };
      this.__socket.emit(broadcastEventMap.JOIN, connectOpts);
    });

    this.__socket.on(clientEventMap.disconnect, (reason: Socket.DisconnectReason) => {
      this.zLog.info(`${clientEventMap.disconnect}:${this.__socket.id}`);
      this.zLog.debug(`reason: ${reason}`);
      if (this.opts.keepAlive) this.__socket.emit(clientEventMap.reconnect)
    });
  }

  protected clientOn<T>(event: BroadcastEvent, listener: (msg: BroadcastRoomData<T>) => void) {
    this.__socket.emit(event, listener);
  }

  protected clientEmit<T>(event: BroadcastEvent, msg: BroadcastRoomData<T>) {
    this.__socket.emit(event, msg);
  }

  private endpointResolver = (opts?: { protocol: Protocol, endpoint: string, port?: number }) => {
    const { endpoint, port } = ((): { protocol: Protocol, endpoint: string, port?: number } => {
      if (opts) return opts;
      return { endpoint: envLoader.SIGHT_PLATFORM_ENDPOINT, protocol: 'https' };
    })();

    const socketPath = '/socket.io/';
    this.__endpoint = [ 
      `${opts.endpoint}://${endpoint}`,
      port ? `:${port}` : null,
      socketPath 
    ].filter(el => el).join('') as SocketEndpoint<Protocol>;
  }
}