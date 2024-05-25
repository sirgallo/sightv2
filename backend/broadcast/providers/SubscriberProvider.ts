import { EventEmitter } from 'events';

import { LogProvider } from '../../core/log/LogProvider.js';
import { ClientProvider } from './ClientProvider.js';
import { RoomEvent, BroadcastRoomData } from '../types/Broadcast.js';
import { SubscriberOpts } from '../types/Client.js';


export class SubscriberProvider extends ClientProvider {
  constructor(opts: SubscriberOpts, zLog = new LogProvider(SubscriberProvider.name)) {
    super(opts, zLog);
  }
}