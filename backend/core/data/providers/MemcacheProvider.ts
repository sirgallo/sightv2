import { Cluster, Redis } from 'ioredis';

import { RedisProvider } from './RedisProvider.js';
import { MemcacheOpts } from '../types/Memcache.js';


export class MemcacheProvider<PRF extends string = undefined>{
  private __client: Cluster | Redis;
  constructor(private __opts: MemcacheOpts<PRF>) {
    const redisProvider = new RedisProvider(this.__opts.connOpts);
    if (! this.__opts?.connOpts || 'cluster' in this.__opts.connOpts) { 
      this.__client = new RedisProvider(this.__opts.connOpts).getCluster({ service: 'memcache', db: this.__opts.cacheName });
    } else {
      this.__client = new RedisProvider(this.__opts.connOpts).getClient({ service: 'memcache', db: this.__opts.cacheName });
    }
  }

  get client() { return this.__client; }

  async set(opts: { key: string, value: string, expire?: boolean }): Promise<boolean> {
    const prefixedKey = this.prefixedKey(opts.key);
    await this.__client.set(prefixedKey, opts.value);
    if (opts.expire) await this.__client.expire(prefixedKey, this.__opts.expirationInSec);
    return true;
  }

  async get(key: string): Promise<any> {
    const prefixedKey = this.prefixedKey(key);
    const strResp = await this.__client.get(prefixedKey);
    if (strResp) return JSON.parse(strResp);
  }

  async delete(key: string): Promise<boolean> {
    const prefixedKey = this.prefixedKey(key);
    await this.__client.del(prefixedKey);
    return true;
  }

  async hset<VAL extends { [field: string]: any } = undefined>(opts: { key: string, value: VAL, expire?: boolean }): Promise<boolean> {
    const prefixedKey = this.prefixedKey(opts.key);
    await this.__client.hset(prefixedKey, opts.value);
    if (opts.expire) await this.__client.expire(prefixedKey, this.__opts.expirationInSec);
    return true;
  }

  async hget(opts: { key: string, field: string }): Promise<string> {
    const prefixedKey = this.prefixedKey(opts.key);
    return this.__client.hget(prefixedKey, opts.field);
  }

  async hgetall<VAL extends { [field: string]: any } = undefined>(key: string): Promise<VAL> {
    const prefixedKey = this.prefixedKey(key);
    const value = await this.__client.hgetall(prefixedKey);
    return value as VAL;
  }

  async hdel(key: string): Promise<boolean> {
    const prefixedKey = this.prefixedKey(key);
    await this.__client.hdel(prefixedKey);
    return true;
  }

  flush(): boolean{
    this.__client.flushdb();
    return true;
  }

  private prefixedKey = (key: string): string => `${this.__opts.prefix}:${key}`;
}