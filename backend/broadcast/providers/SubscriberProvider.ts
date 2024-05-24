import { EventEmitter } from 'events';

import { LogProvider } from '../../core/log/LogProvider.js';
import { ClientProvider } from './ClientProvider.js';
import { BroadcastEvent, BroadcastRoomData } from '../types/Broadcast.js';
import { SubscriberOpts } from '../types/Client.js';


export class SubscriberProvider extends ClientProvider {
  private __subscriberEvents = new EventEmitter();
  private __event: BroadcastEvent;

  constructor(opts: SubscriberOpts, zLog = new LogProvider(SubscriberProvider.name)) {
    super(opts, zLog);
    this.__event = opts.event;
    this.subscribe();
  }

  get event() { return this.__event; }

  on<T>(listener: (msg: BroadcastRoomData<T>) => void) {
    return this.__subscriberEvents.on(this.__event, listener);
  }
  
  private subscribe<T>() {
    this.clientOn(this.__event, (msg: BroadcastRoomData<T>) => this.__subscriberEvents.emit(this.__event, msg));
  }
}