import { ClientProvider } from '../core/broadcast/providers/ClientProvider.js';
import { LogProvider } from '../core/log/LogProvider.js';
import { RedisProvider } from '../core/data/providers/RedisProvider.js';
import { DEFAULT_CLUSTER_OPTIONS } from '../core/data/types/Redis.js';
import { Connection } from '../common/Connection.js';
import { Profile } from '../common/Profile.js';


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

  static broadcast(token: string) {
    return new ClientProvider(
      { token, keepAlive: true }, 
      new LogProvider(`${SightIOConnection.name}:${this.broadcast.name}`)
    );
  }

  static etcd() {
    return Connection.etcd();
  }

  static async mongo() {
    return Connection.mongo();
  }
}