import { Redis } from 'ioredis';

import { RedisProvider } from './RedisProvider.js';
import { QueueOpts, BPOPResp } from '../types/Queue.js';


export class QueueProvider {
  private redisClient: Redis;
  constructor(private opts: QueueOpts) {
    this.redisClient = new RedisProvider(this.opts?.redisOpts).getClient({ service: 'queue', db: this.opts.queueName });
  }

  async leftPush(elements: any[]): Promise<boolean> {
    await this.redisClient.lpush(this.opts.queueName, ...elements);
    return true;
  }

  async rightPush(elements: any[]): Promise<boolean> {
    await this.redisClient.rpush(this.opts.queueName, ...elements);
    return true;
  }

  async blockingLeftPop(opts: { timeout: number, waitIndefinitely?: boolean }): Promise<BPOPResp> {
    return this.redisClient.blpop(this.opts.queueName, opts?.waitIndefinitely ? 0 : opts.timeout);
  }

  async blockingRightPop(opts: { timeout: number, waitIndefinitely?: boolean }): Promise<BPOPResp> {
    return this.redisClient.brpop(this.opts.queueName, opts?.waitIndefinitely ? 0 : opts.timeout);
  }
}