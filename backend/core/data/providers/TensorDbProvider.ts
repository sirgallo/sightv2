import { Redis, RedisValue } from 'ioredis';

import { RedisProvider } from './RedisProvider.js';
import { MemcacheProvider } from './MemcacheProvider.js';
import { LogProvider } from '../../log/LogProvider.js';
import { NodeUtil } from '../../utils/Node.js';
import { 
  TensorData, TensorDbOpts, TensorOperation, TensorType, TensorMetadata,
  TensorMetadataOperation, ExecTensorResponse, ExecTensorOpts, TENSOR_CONSTANTS
} from '../types/TensorDb.js';


export class TensorDbProvider {
  private redisClient: Redis;
  private memcache: MemcacheProvider<typeof TENSOR_CONSTANTS.PREFIX.METADATA, TensorMetadata>;
  private zLog = new LogProvider(TensorDbProvider.name);

  constructor(opts: TensorDbOpts) {
    this.redisClient = new RedisProvider(opts.redisOpts).getClient({ service: 'vector', db: opts.dbName });
    this.memcache = new MemcacheProvider({
      cacheName: 'tensorcache',
      prefix: TENSOR_CONSTANTS.PREFIX.METADATA,
      expirationInSec: 10000,
      redisOpts: opts.redisOpts 
    });
  }

  async exec<T extends TensorOperation | TensorMetadataOperation>(opts: ExecTensorOpts<T>): Promise<ExecTensorResponse<T>> {
    try {
      if ('tensors' in opts) return this.__setTensors(opts) as Promise<ExecTensorResponse<T>>;
      if ('keys' in opts) return this.__getTensors(opts) as Promise<ExecTensorResponse<T>>;
      if ('meta' in opts) return this.__setTensorMetadata(opts) as Promise<ExecTensorResponse<T>>;
      
      return this.__getTensorMetadata(opts) as Promise<ExecTensorResponse<T>>;
    } catch (err) {
      this.zLog.error(`err: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  private async __setTensors(opts: ExecTensorOpts<'AI.TENSORSET'>): Promise<ExecTensorResponse<'AI.TENSORSET'>> {
    const pipeline = this.redisClient.pipeline();
    for (const tensor of opts.tensors) { pipeline.call(...TensorDbCommandGenerator.TENSORSET(tensor, opts.tensorType)); }
    await pipeline.exec()
    
    return true;
  }

  private async __getTensors(opts: ExecTensorOpts<'AI.TENSORGET'>): Promise<ExecTensorResponse<'AI.TENSORGET'>> {
    if (! opts.preprocess) {
      const pipeline = this.redisClient.pipeline();
      for (const k of opts.keys) { pipeline.call(...TensorDbCommandGenerator.TENSORGET(k)); }
      const result = await pipeline.exec();
      console.log('result in get:', result);
      return result.map(res => res[1]) as TensorData['v'];
    }
    
    return this.redisClient.eval(...TensorDbCommandGenerator.TENSORGETLUA(opts.keys)) as Promise<ExecTensorResponse<'AI.TENSORGET'>>;
  }

  private async __setTensorMetadata(opts: ExecTensorOpts<'METADATA.SET'>): Promise<ExecTensorResponse<'METADATA.SET'>> {
    await this.memcache.hset(opts.k, opts.meta);
    return true;
  }

  private async __getTensorMetadata(opts: ExecTensorOpts<'METADATA.GET'>): Promise<ExecTensorResponse<'METADATA.GET'>> {
    return this.memcache.hgetall(opts.k);
  }
}


class TensorDbCommandGenerator {
  static TENSORSET = ({ k, v, shape }: TensorData, tensorType: TensorType): [ string, RedisValue[] ] => {
    return [ TENSOR_CONSTANTS.OP['AI.TENSORSET'], [ k, tensorType, ...shape.dimensions, TENSOR_CONSTANTS.CMD.VALUES, ...v ] ];
  }

  static TENSORGET = (k: string): [ string, RedisValue[] ] => {
    return [ TENSOR_CONSTANTS.OP['AI.TENSORGET'], [ k, TENSOR_CONSTANTS.CMD.VALUES ] ];
  }

  static TENSORGETLUA = (keys: string[]): [ string, number, ...string[] ] => {
    return [ TENSOR_CONSTANTS.LUA['AI.TENSORGET'], keys.length, ...keys ];
  }
}