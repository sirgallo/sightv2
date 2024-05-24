import { Cluster, Redis, ClusterOptions, RedisOptions, ClusterNode } from 'ioredis';

import { envLoader } from '../../../common/EnvLoader.js';
import { 
  ClientOpts, RedisService, RedisDb,
  REDIS_SERVICE_REGISTRY, DEFAULT_CLUSTER_OPTIONS, DEFAULT_CLIENT_OPTIONS 
} from '../types/Redis.js';


export class RedisProvider {
  private __clientMap: Map<RedisDb, Redis> = new Map();
  private __clusterMap: Map<RedisDb, Cluster> = new Map();
  constructor(private __opts?: { redis: RedisOptions } | { nodes: ClusterNode[], cluster: ClusterOptions }) {}

  getClient<T extends RedisService>(opts: ClientOpts<T>): Redis {
    if (this.__opts && ! ('redis' in this.__opts)) throw new Error('redis client options undefined');

    const validatedDb = this.validatedDb(opts);
    const validatedOpts: RedisOptions = { 
      ...this.__opts?.['redis'] ?? DEFAULT_CLIENT_OPTIONS, 
      ...{ db: REDIS_SERVICE_REGISTRY[opts.service].dbs[opts.db] }
    };
    
    const existingClient = this.__clientMap.get(validatedDb)
    if (! existingClient) { 
      this.__clientMap.set(validatedDb, new Redis(validatedOpts));
      return this.__clientMap.get(validatedDb);
    }
    
    return existingClient;
  }

  getCluster<T extends RedisService>(opts: ClientOpts<T>): Cluster {
    if (this.__opts && ! ('cluster' in this.__opts)) throw new Error('redis cluster options undefined');
    
    const validatedDb = this.validatedDb(opts);
    const validatedOpts: ClusterOptions = {
      ...this.__opts?.['cluster'] ?? DEFAULT_CLUSTER_OPTIONS,
      ...{ db: REDIS_SERVICE_REGISTRY[opts.service].dbs[opts.db] }
    };

    const existingCluster = this.__clusterMap.get(validatedDb);
    if (! existingCluster) { 
      const nodes = this.__opts?.['nodes'] ?? this.defaultClusterNodes();
      this.__clusterMap.set(validatedDb, new Cluster(nodes, validatedOpts));
      return this.__clusterMap.get(validatedDb);
    }
    
    return existingCluster;
  }

  async removeClient<T extends RedisService>(opts: ClientOpts<T>): Promise<boolean> {
    const validatedDb = this.validatedDb(opts);
    const existingClient = this.__clientMap.get(validatedDb);
    if (! existingClient) return true;

    await existingClient.quit()
    return this.__clientMap.delete(validatedDb);
  }

  async removeCluster<T extends RedisService>(opts: ClientOpts<T>): Promise<boolean> {
    const validatedDb = this.validatedDb(opts);
    const existingCluster = this.__clusterMap.get(validatedDb)
    if (! existingCluster) return true;

    await existingCluster.quit()
    return this.__clusterMap.delete(validatedDb);
  }

  private validatedDb = <T extends RedisService>(opts: ClientOpts<T>): RedisDb => {
    return `${opts.service}:${opts.db}`;
  }

  private defaultClusterNodes = (): ClusterNode[] => {
    const listAsString = envLoader.SIGHT_REDIS_HOSTS;
    const port = envLoader.SIGHT_REDIS_PORT;

    return listAsString?.split(',').map((host: string): ClusterNode => {
      return { host: host.trim(), port }
    });
  }
}