import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

import { MemcacheDb } from './Redis.js';


export interface MemcacheOpts<T extends string = undefined> {
  cacheName: MemcacheDb;
  expirationInSec: number;
  prefix?: T;
  connOpts?: { redis: RedisOptions } | { nodes: ClusterNode[], cluster: ClusterOptions };
}