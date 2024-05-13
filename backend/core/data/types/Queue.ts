import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

import { QueueDb } from './Redis.js';


export interface QueueOpts {
  queueName: QueueDb;
  connOpts?: { redis: RedisOptions } | { nodes: ClusterNode[], cluster: ClusterOptions };
}

export type BPOPResp = [
  string,          // queue name
  string           // element
];