import { ClusterOptions, RedisOptions } from 'ioredis';

import { BackoffUtil } from '../../utils/Backoff.js';


export const redisServices = <const> [
  'broadcast',
  'memcache',
  'queue',
  'vector'
];

export const broadcastDbs = <const>[
  'client_broadcast',
  'internal_broadcast',
  'io_broadcast'
];

export const memcacheDbs = <const>[
  'acl_cache',
  'model_cache',
  'room_cache',
  'tensor_cache',
  'io_cache'
];

export const queueDbs = <const>[
  'search_queue',
  'task_queue',
  'io_queue'
];

export const vectorDbs = <const>[
  'db_tensor',
  'io_tensor'
];

export type RedisService = typeof redisServices[number];

export type BroadcastDb = typeof broadcastDbs[number];
export type MemcacheDb = typeof memcacheDbs[number];
export type QueueDb = typeof queueDbs[number];
export type VectorDb = typeof vectorDbs[number];

export type RedisDb = `${RedisService}:${BroadcastDb | MemcacheDb | QueueDb | VectorDb}`;


type ServiceDbMap<T extends RedisService> = 
  T extends 'broadcast' ? BroadcastDb
  : T extends 'memcache' ? MemcacheDb
  : T extends 'queue' ? QueueDb
  : T extends 'vector' ? VectorDb
  : never;

type RedisServiceRegistry = { 
  [service in RedisService]: { 
    offset: number, dbs: { [db in ServiceDbMap<service>]: number }
  } 
};

export interface ClientOpts<T extends RedisService> {
  service: T;
  db: ServiceDbMap<T>;
}

export const REDIS_SERVICE_REGISTRY: RedisServiceRegistry = {
  broadcast: { offset: 0, dbs: { client_broadcast: 0, internal_broadcast: 1, io_broadcast: 2 } },
  memcache: { offset: 4, dbs: { acl_cache: 4, model_cache: 5, room_cache: 6, tensor_cache: 7, io_cache: 8 } },
  queue: { offset: 10, dbs: { search_queue: 10, task_queue: 11, io_queue: 12  } },
  vector: { offset: 14, dbs: { db_tensor: 14, io_tensor: 15 } }
}

export const DEFAULT_CLIENT_OPTIONS: RedisOptions = {
  connectTimeout: 10000,
  retryStrategy: (times: number) => BackoffUtil.strategy(times, 250),
  maxRetriesPerRequest: 5
}

export const DEFAULT_CLUSTER_OPTIONS: ClusterOptions = {
  scaleReads: 'slave',
  slotsRefreshTimeout: 2000,
  redisOptions: DEFAULT_CLIENT_OPTIONS,
  clusterRetryStrategy: (times: number) => {
    const delay = BackoffUtil.strategy(times, 250)
    return delay;
  },
  enableReadyCheck: true,
  enableOfflineQueue: true,
}