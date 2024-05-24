import { RedisProvider } from './RedisProvider.js';
import { LogProvider } from '../../log/LogProvider.js';
import { NodeUtil } from '../../utils/Node.js';
import { MemcacheOpts } from '../types/Memcache.js';


export class MemcacheProvider<PRF extends string = undefined>{
  private __redisProvider: RedisProvider;
  private __zLog = new LogProvider(MemcacheProvider.name);

  constructor(private __opts: MemcacheOpts<PRF>) {
    this.__redisProvider = new RedisProvider(this.__opts.connOpts);
  }

  get client() {
    if (! this.__opts?.connOpts || 'cluster' in this.__opts.connOpts) { 
      return this.__redisProvider.getCluster({ service: 'memcache', db: this.__opts.db });
    } else { return this.__redisProvider.getClient({ service: 'memcache', db: this.__opts.db }); } 
  }

  async close() {
    return this.__removeClient();
  }

  async set(opts: { key: string, value: string, expire?: boolean }): Promise<boolean> {
    const handler = async (opts: { key: string, value: string, expire?: boolean }): Promise<boolean> => {
      const prefixedKey = this.__prefixedKey(opts.key);
      await this.client.set(prefixedKey, opts.value);
      if (opts.expire) await this.client.expire(prefixedKey, this.__opts.expirationInSec);
      return true;
    };

    return this.__execcmd(handler, opts);
  }

  async get<T>(key: string): Promise<T> {
    const handler = async (key: string): Promise<T> => {
      const prefixedKey = this.__prefixedKey(key);
      const strResp = await this.client.get(prefixedKey);
      if (strResp) return JSON.parse(strResp);
    };

    return this.__execcmd(handler, key);
  }

  async delete(key: string): Promise<boolean> {
    const handler = async (key: string): Promise<boolean> => {
      const prefixedKey = this.__prefixedKey(key);
      await this.client.del(prefixedKey);
      return true;
    };
    
    return this.__execcmd(handler, key);
  }

  async hset<T extends { [field: string]: any } = undefined>(opts: { key: string, value: T, expire?: boolean }): Promise<boolean> {
    const handler = async (opts: { key: string, value: T, expire?: boolean }): Promise<boolean> => {
      const prefixedKey = this.__prefixedKey(opts.key);
      await this.client.hset(prefixedKey, opts.value);
      if (opts.expire) await this.client.expire(prefixedKey, this.__opts.expirationInSec);
      return true;
    };
    
    return this.__execcmd(handler, opts);
  }

  async hget(opts: { key: string, field: string }): Promise<string> {
    const handler = async (opts: { key: string, field: string }): Promise<string> => {
      const prefixedKey = this.__prefixedKey(opts.key);
      return this.client.hget(prefixedKey, opts.field);
    };

    return this.__execcmd(handler, opts);
  }

  async hgetall<T extends { [field: string]: any } = undefined>(key: string): Promise<T> {
    const handler = async (key: string): Promise<T> => {
      const prefixedKey = this.__prefixedKey(key);
      const value = await this.client.hgetall(prefixedKey);
      return value as T;
    };

    return this.__execcmd(handler, key);
  }

  async hdel(key: string): Promise<boolean> {
    const handler = async (key: string): Promise<boolean> => {
      const prefixedKey = this.__prefixedKey(key);
      await this.client.hdel(prefixedKey);
      return true;
    };
    
    return this.__execcmd(handler, key);
  }

  flush(): boolean{
    this.client.flushdb();
    return true;
  }

  private async __execcmd<T extends (...args: any) => any>(
    fn: (...args: Parameters<T>) => Promise<ReturnType<T>>,
    ...args: Parameters<T>
  ) {
    try {
      const boundFn = fn.bind(this);
      return boundFn(...args);
    } catch(err) {
      this.__zLog.error(`exec redis cmd err: ${NodeUtil.extractErrorMessage(err)}`);
      await this.__removeClient().catch(e => { 
        this.__zLog.error(`close redis client err: ${NodeUtil.extractErrorMessage(e)}`);
      });

      throw err;
    }
  }

  private __prefixedKey = (key: string): string => `${this.__opts.prefix}:${key}`;
  
  private async __removeClient() {
    if (! this.__opts?.connOpts || 'cluster' in this.__opts.connOpts) { 
      await this.__redisProvider.removeCluster({ service: 'memcache', db: this.__opts.db });
    } else { await this.__redisProvider.removeClient({ service: 'memcache', db: this.__opts.db }); }
  }
}