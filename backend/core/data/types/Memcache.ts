import { RedisOptions } from 'ioredis';

import { MemcacheDb } from './Redis.js';


export interface MemcacheOpts<T extends string> {
  cacheName: MemcacheDb;
  expirationInSec?: number;
  prefix?: T;
  redisOpts?: RedisOptions
}