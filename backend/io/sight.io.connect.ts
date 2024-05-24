import { hostname } from 'os';

import { LogProvider } from '../core/log/LogProvider.js';
import { RedisProvider } from '../core/data/providers/RedisProvider.js';
import { DEFAULT_CLUSTER_OPTIONS } from '../core/data/types/Redis.js';
import { Connection } from '../common/Connection.js';
import { Profile } from '../common/Profile.js';
import { PublisherProvider } from '../broadcast/providers/PublisherProvider.js';
import { SubscriberProvider } from '../broadcast/providers/SubscriberProvider.js'
import { BroadcastEvent } from '../broadcast/types/Broadcast.js';


export class SightIOConnection {
  static getRedis(cluster = true) {
    const client = new RedisProvider({ nodes: Profile.redisCluster(), cluster: DEFAULT_CLUSTER_OPTIONS });
    if (cluster) return client.getCluster({ service: 'memcache', db: 'io_cache' });
    return client.getClient({ service: 'memcache', db: 'io_cache' });
  }

  static memcache(prefix: string) {
    return Connection.memcache({ db: 'io_cache', prefix })
  }

  static queue() {
    return Connection.queue('io_queue')
  }

  static publisher() {
    return new PublisherProvider(
      { db: 'room_cache', keepAlive: true, conn: { protocol: 'https', endpoint: hostname() } }, 
      new LogProvider(`${SightIOConnection.name}:${this.publisher.name}`)
    );
  }

  static subscriber(event: BroadcastEvent) {
    return new SubscriberProvider(
      { db: 'room_cache', event, keepAlive: true, conn: { protocol: 'https', endpoint: hostname() } }, 
      new LogProvider(`${SightIOConnection.name}:${this.subscriber.name}`)
    );
  }

  static etcd() {
    return Connection.etcd();
  }

  static async mongo() {
    return Connection.mongo();
  }
}