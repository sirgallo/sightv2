export const redisServices = <const> [
  'memcache',
  'queue',
  'vector'
];

export const memcacheDbs = <const> [
  'tensorcache'
];

export const queueDbs = <const> [
  'tensorqueue'
];

export const vectorDbs = <const> [
  'tensordb',
  'tensorio'
];

export type RedisService = typeof redisServices[number];

export type MemcacheDb = typeof memcacheDbs[number];
export type QueueDb = typeof queueDbs[number];
export type VectorDb = typeof vectorDbs[number];

export type RedisDb = `${RedisService}:${MemcacheDb | QueueDb | VectorDb}`;


type ServiceDbMap<T extends RedisService> = 
  T extends 'memcache' ? MemcacheDb
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
  memcache: { offset: 0, dbs: { tensorcache: 0 } },
  queue: { offset: 4, dbs: { tensorqueue: 4 } },
  vector: { offset: 8, dbs: { tensordb: 8, tensorio: 9 } }
}