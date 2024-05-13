import { hostname } from 'os';
import { ClusterNode } from 'ioredis';

import { LogProvider } from '../core/log/LogProvider.js';
import { ETCDProvider } from '../core/replication/EtcdProvider.js';
import { RedisProvider } from '../core/data/providers/RedisProvider.js';
import { MemcacheProvider } from '../core/data/providers/MemcacheProvider.js';
import { QueueProvider } from '../core/data/providers/QueueProvider.js';
import { DEFAULT_CLUSTER_OPTIONS } from '../core/data/types/Redis.js';
import { envLoader } from '../common/EnvLoader.js';
import { SightMongoProvider } from '../db/SightProvider.js';
import { PublisherProvider } from '../broadcast/providers/PublisherProvider.js';
import { SubscriberProvider } from '../broadcast/providers/SubscriberProvider.js'
import { BroadcastEvent, BroadcastRoomData } from '../broadcast/types/Broadcast.js';
import { MockRoomDataPayload } from './data/room.sight.io.data.js';
import { DEFAULT_IO_BROADCAST_PORT } from './sight.io.types.js';


export class SightIOConnect {
  static getRedis(cluster = true) {
    const client = new RedisProvider({ nodes: defaultClusterNodes(), cluster: DEFAULT_CLUSTER_OPTIONS });
    if (cluster) return client.getCluster({ service: 'memcache', db: 'io_cache' });
    return client.getClient({ service: 'memcache', db: 'io_cache' });
  }

  static getMemcache(prefix: string) {
    return new MemcacheProvider({
      db: 'io_cache', prefix, expirationInSec: 10000,
      connOpts: { nodes: defaultClusterNodes(), cluster: DEFAULT_CLUSTER_OPTIONS }
    })
  }

  static getQueue() {
    return new QueueProvider({
      db: 'io_queue',
      connOpts: { nodes: defaultClusterNodes(), cluster: DEFAULT_CLUSTER_OPTIONS }
    });
  }

  static getPublisher() {
    return new PublisherProvider({
      db: 'io_broadcast', keepAlive: true,
      connOpts: { nodes: defaultClusterNodes(), cluster: DEFAULT_CLUSTER_OPTIONS },
      conn: { protocol: 'https', endpoint: hostname(), port: DEFAULT_IO_BROADCAST_PORT },
    }, new LogProvider(`${SightIOConnect.name}:${this.getPublisher.name}`));
  }

  static getSubscriber(
    event: BroadcastEvent
  ): SubscriberProvider<BroadcastRoomData<MockRoomDataPayload>> {
    return new SubscriberProvider({
      db: 'io_broadcast', event, keepAlive: true,
      connOpts: { nodes: defaultClusterNodes(), cluster: DEFAULT_CLUSTER_OPTIONS },
      conn: { protocol: 'https', endpoint: hostname(), port: DEFAULT_IO_BROADCAST_PORT }
    }, new LogProvider(`${SightIOConnect.name}:${this.getSubscriber.name}`));
  }

  static getEtcd() {
    return new ETCDProvider();
  }

  static getMongo() {
    return new SightMongoProvider();
  }
}


const defaultClusterNodes = (): ClusterNode[] => {
  const listAsString = envLoader.SIGHT_REDIS_HOSTS;
  const port = envLoader.SIGHT_REDIS_PORT;

  return listAsString?.split(',').map((host: string): ClusterNode => {
    return { host: host.trim(), port }
  })
}