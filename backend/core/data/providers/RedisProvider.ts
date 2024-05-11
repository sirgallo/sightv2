import { Redis, RedisOptions } from 'ioredis';

import { ClientOpts, RedisDb, RedisService, REDIS_SERVICE_REGISTRY } from '../types/Redis.js';


export class RedisProvider {
  private clientMap: Map<RedisDb, Redis> = new Map();
  constructor(private redisOpts: RedisOptions) {}

  getClient<T extends RedisService>(opts: ClientOpts<T>): Redis {
    const validatedDb = this.validatedDb(opts);
    const validatedOpts: RedisOptions = { 
      ...this.redisOpts, 
      ...{ db: REDIS_SERVICE_REGISTRY[opts.service].dbs[opts.db] }
    };
    
    const existingClient = this.clientMap.get(validatedDb)
    if (! existingClient) { 
      this.clientMap.set(validatedDb, new Redis(validatedOpts));
      return this.clientMap.get(validatedDb);
    }
    
    return existingClient;
  }

  async removeClient<T extends RedisService>(opts: ClientOpts<T>): Promise<boolean> {
    const validatedDb = this.validatedDb(opts);
    const existingClient = this.clientMap.get(validatedDb);
    if (! existingClient) return true;

    await existingClient.quit()
    return this.clientMap.delete(validatedDb);
  }

  private validatedDb = <T extends RedisService>(opts: ClientOpts<T>): RedisDb => {
    return `${opts.service}:${opts.db}`;
  }
}