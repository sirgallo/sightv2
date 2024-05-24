import { Cluster, Redis } from 'ioredis';

import { RedisProvider } from '../../data/providers/RedisProvider.js';
import { QueueOpts, BPOPResp } from '../types/Queue.js';


export class QueueProvider {
  private __client: Cluster | Redis;
  constructor(private __opts: QueueOpts) {
    if ('cluster' in this.__opts.connOpts) this.__client = new RedisProvider(this.__opts.connOpts).getCluster({ service: 'queue', db: this.__opts.db });
    else this.__client = new RedisProvider(this.__opts?.connOpts).getClient({ service: 'queue', db: this.__opts.db });
  }

  get client() { return this.__client; }

  async leftPush<T extends any[]>(elements: T): Promise<boolean> {
    await this.__client.lpush(this.__opts.db, ...elements);
    return true;
  }

  async rightPush<T extends any[]>(elements: T): Promise<boolean> {
    await this.__client.rpush(this.__opts.db, ...elements);
    return true;
  }

  async blockingLeftPop(opts: { timeout: number, waitIndefinitely?: boolean }): Promise<BPOPResp> {
    return this.__client.blpop(this.__opts.db, opts?.waitIndefinitely ? 0 : opts.timeout);
  }

  async blockingRightPop(opts: { timeout: number, waitIndefinitely?: boolean }): Promise<BPOPResp> {
    return this.__client.brpop(this.__opts.db, opts?.waitIndefinitely ? 0 : opts.timeout);
  }
}