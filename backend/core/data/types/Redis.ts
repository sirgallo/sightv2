import { ClusterOptions, RedisOptions } from 'ioredis';

import { BackoffUtil } from '../../utils/Backoff.js';


export const redisServices = <const> [
  'memcache',
  'queue',
  'stream',
  'vector'
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

export const streamDbs = <const>[
  'broadcast_stream'
]

export const vectorDbs = <const>[
  'db_tensor',
  'io_tensor'
];

export type RedisService = typeof redisServices[number];

export type MemcacheDb = typeof memcacheDbs[number];
export type QueueDb = typeof queueDbs[number];
export type StreamDb = typeof streamDbs[number];
export type VectorDb = typeof vectorDbs[number];

export type RedisDb = `${RedisService}:${MemcacheDb | QueueDb | StreamDb | VectorDb}`;

export type ServiceDbMap<T extends RedisService> = 
  T extends 'memcache' ? MemcacheDb
  : T extends 'queue' ? QueueDb
  : T extends 'stream' ? StreamDb
  : T extends 'vector' ? VectorDb
  : never;

type RedisServiceRegistry = { 
  [service in RedisService]: { offset: number, dbs: { [db in ServiceDbMap<service>]: number } } 
};

export interface ClientOpts<T extends RedisService> {
  service: T;
  db: ServiceDbMap<T>;
}

export const REDIS_SERVICE_REGISTRY: RedisServiceRegistry = {
  memcache: { offset: 0, dbs: { acl_cache: 0, model_cache: 1, room_cache: 2, tensor_cache: 3, io_cache: 4 } },
  queue: { offset: 8, dbs: { search_queue: 8, task_queue: 9, io_queue: 10  } },
  stream: { offset: 16, dbs: { broadcast_stream: 14 }},
  vector: { offset: 30, dbs: { db_tensor: 30, io_tensor: 31 } }
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