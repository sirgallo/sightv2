import { LogProvider } from '../../core/log/LogProvider.js';
import { ClientProvider } from './ClientProvider.js';
import { BroadcastRoomData } from '../types/Broadcast.js';
import { ClientOpts } from '../types/Client.js';


export class PublisherProvider extends ClientProvider {
  constructor(opts: ClientOpts, zLog = new LogProvider(PublisherProvider.name)) {
    super(opts, zLog);
  }
  
  async publish<T>(msg: BroadcastRoomData<T>) {
    this.send(msg);
  }
}