import { hostname } from 'os';
import { ClusterNode } from 'ioredis';

import { LogProvider } from '../core/log/LogProvider.js';
import { RedisProvider } from '../core/data/providers/RedisProvider.js';
import { MemcacheProvider } from '../core/data/providers/MemcacheProvider.js';
import { QueueProvider } from '../core/data/providers/QueueProvider.js';
import { DEFAULT_CLUSTER_OPTIONS } from '../core/data/types/Redis.js';
import { envLoader } from '../common/EnvLoader.js';
import { SightMongoProvider } from '../db/SightProvider.js';
import { PublisherProvider } from '../broadcast/providers/PublisherProvider.js';
import { SubscriberProvider } from '../broadcast/providers/SubscriberProvider.js'


export class SightIOConnect {
  static async getRedis() {

  }

  static async getMemcache() {

  }

  static async getQueue() {

  }

  static async getPublisher() {
    const zLog = new LogProvider(`${SightIOConnect.name}:${this.getPublisher.name}`);
    return new PublisherProvider({
      connOpts: { nodes: defaultClusterNodes(), cluster: DEFAULT_CLUSTER_OPTIONS },
      db: 'io_broadcast',
      conn: { protocol: 'https', endpoint: hostname() },
      keepAlive: false
    });
  }

  static async getSubscriber() {
    const zLog = new LogProvider(`${SightIOConnect.name}:${this.getSubscriber.name}`);
  }

  static async getMongo() {
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