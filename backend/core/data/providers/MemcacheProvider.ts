import { Redis } from 'ioredis';

import { RedisProvider } from './RedisProvider.js';
import { MemcacheOpts } from '../types/Memcache.js';


export class MemcacheProvider<T extends string, V extends { [field: string]: any }> {
  private redisClient: Redis;
  constructor(private opts: MemcacheOpts<T>) {
    this.redisClient = new RedisProvider(opts.redisOpts).getClient({ service: 'memcache', db: opts.cacheName });
  }

  async set(key: string, value: string): Promise<boolean> {
    const prefixedKey = this.prefixedKey(key);
    await this.redisClient.set(prefixedKey, value);
    if (this.opts.expirationInSec) await this.redisClient.expire(prefixedKey, this.opts.expirationInSec);
    return true;
  }

  async get(key: string): Promise<any> {
    const prefixedKey = this.prefixedKey(key);
    const strResp = await this.redisClient.get(prefixedKey);
    if (strResp) return JSON.parse(strResp);
  }

  async delete(key: string): Promise<boolean> {
    const prefixedKey = this.prefixedKey(key);
    await this.redisClient.del(prefixedKey);
    return true;
  }

  async hset(key: string, value: V): Promise<boolean> {
    const prefixedKey = this.prefixedKey(key);
    await this.redisClient.hset(prefixedKey, value);
    return true;
  }

  async hget(key: string, field: string): Promise<string> {
    const prefixedKey = this.prefixedKey(key);
    return this.redisClient.hget(prefixedKey, field);
  }

  async hgetall(key: string): Promise<V> {
    const prefixedKey = this.prefixedKey(key);
    const value = await this.redisClient.hgetall(prefixedKey);
    return value as V;
  }

  flush(): boolean{
    this.redisClient.flushdb();
    return true;
  }

  private prefixedKey = (key: string): string => `${this.opts.prefix}:${key}`;
}