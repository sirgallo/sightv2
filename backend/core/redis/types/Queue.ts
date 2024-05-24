import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

import { QueueDb } from '../../data/types/Redis.js';


export interface QueueOpts {
  db: QueueDb;
  connOpts?: { redis: RedisOptions } | { nodes: ClusterNode[], cluster: ClusterOptions };
}

export type BPOPResp = [
  string, // queue name
  string // element
];