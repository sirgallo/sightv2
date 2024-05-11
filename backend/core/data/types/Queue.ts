import { RedisOptions } from 'ioredis';

import { QueueDb } from './Redis.js';


export interface QueueOpts {
  queueName: QueueDb;
  redisOpts?: RedisOptions;
}

export type BPOPResp = [
  string,          // queue name
  string           // element
];