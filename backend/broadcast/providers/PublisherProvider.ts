import { LogProvider } from '../../core/log/LogProvider.js';
import { ClientProvider } from './ClientProvider.js';
import { BroadcastRoomMessage, ClientServerEvents } from '../types/Broadcast.js';
import { ClientOpts } from '../types/Client.js';


export class PublisherProvider {
  private __clientProvider: ClientProvider;

  constructor(opts: ClientOpts, private zLog = new LogProvider(PublisherProvider.name)) {
    this.__clientProvider = new ClientProvider(opts, zLog);
  }

  join(opts: Pick<BroadcastRoomMessage, 'roomId' | 'orgId' | 'role' | 'roomType'>) {
    this.__clientProvider.socket.emit('join_room', opts);
  }

  leave(opts: Pick<BroadcastRoomMessage, 'roomId'>) {
    this.__clientProvider.socket.emit('leave_room', opts);
  }

  pub<T>(msg: Pick<BroadcastRoomMessage<T>, 'roomId' | 'payload'>) {
    this.__clientProvider.socket.emit('pub_room', msg, ackMsg => {
      this.zLog.debug(`published message acknowledged: ${ackMsg}`);
    });
  }

  close() {
    this.__clientProvider.socket.disconnect();
  }
}

type PublisherEventMap = { [k in keyof ClientServerEvents]: Parameters<ClientServerEvents[k]> };