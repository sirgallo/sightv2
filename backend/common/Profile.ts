import { IOptions } from 'etcd3';
import { ClusterNode } from 'ioredis';
import { envLoader } from './EnvLoader.js';


export class Profile {
  static mongoConnectionString(): `mongodb://${string}:${string}@${string}` {
    const endpoint = `mongodb://${envLoader.SIGHT_DB_USER}:${envLoader.SIGHT_DB_PASS}@${envLoader.SIGHT_DB_HOSTS}`;
    const db = `sight?replicaset=${envLoader.SIGHT_DB_REPLICA_SET}`;
    
    return [ endpoint, db ].join('/') as `mongodb://${string}:${string}@${string}`;
  }

  static redisCluster(): ClusterNode[] {
    const listAsString = envLoader.SIGHT_REDIS_HOSTS;
    const port = envLoader.SIGHT_REDIS_PORT;

    return listAsString?.split(',').map((host: string): ClusterNode => {
      return { host: host.trim(), port }
    });
  }

  static etcdCluster(): IOptions {
    const hosts: string[] = ((): string[] => {
      const listAsString = envLoader.SIGHT_ETCD_HOSTS;
      return listAsString?.split(',') ?? null;
    })();
  
    return { hosts };
  }
}