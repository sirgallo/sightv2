import { ClusterNode } from 'ioredis';

import { ETCDProvider } from '../core/replication/EtcdProvider.js';
import { RedisProvider } from '../core/data/providers/RedisProvider.js';
import { MemcacheProvider } from '../core/data/providers/MemcacheProvider.js';
import { QueueProvider } from '../core/data/providers/QueueProvider.js';
import { MongoOpts } from '../core/data/types/Mongo.js';
import { DEFAULT_CLUSTER_OPTIONS, ServiceDbMap, RedisService } from '../core/data/types/Redis.js';
import { envLoader } from '../common/EnvLoader.js';
import { SightMongoProvider } from '../db/SightProvider.js';
import { Profile } from './Profile.js';


export class Connection {
  static redis<T extends RedisService>(opts: { service: T, db: ServiceDbMap<T> }, cluster = true) {
    const client = new RedisProvider({ nodes: defaultClusterNodes(), cluster: DEFAULT_CLUSTER_OPTIONS });
    if (cluster) return client.getCluster(opts);
    return client.getClient(opts);
  }

  static memcache(opts: { db: ServiceDbMap<'memcache'>, prefix: string }) {
    return new MemcacheProvider({
      db: opts.db, prefix: opts.prefix, expirationInSec: 10000,
      connOpts: { nodes: defaultClusterNodes(), cluster: DEFAULT_CLUSTER_OPTIONS }
    })
  }

  static queue(db: ServiceDbMap<'queue'>) {
    return new QueueProvider({ db, connOpts: { nodes: defaultClusterNodes(), cluster: DEFAULT_CLUSTER_OPTIONS } });
  }

  static etcd() {
    return new ETCDProvider(Profile.etcdCluster());
  }

  static async mongo(opts?: MongoOpts) {
    const sightDb = new SightMongoProvider();
    await sightDb.createNewConnection(opts)
    return sightDb;
  }
}


const defaultClusterNodes = (): ClusterNode[] => {
  const listAsString = envLoader.SIGHT_REDIS_HOSTS;
  const port = envLoader.SIGHT_REDIS_PORT;

  return listAsString?.split(',').map((host: string): ClusterNode => {
    return { host: host.trim(), port }
  });
}