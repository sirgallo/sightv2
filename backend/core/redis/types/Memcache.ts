import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

import { MemcacheDb } from '../../data/types/Redis.js';


export interface MemcacheOpts<T extends string = undefined> {
  db: MemcacheDb;
  expirationInSec: number;
  connOpts?: { redis: RedisOptions } | { nodes: ClusterNode[], cluster: ClusterOptions };
  prefix?: T;
}