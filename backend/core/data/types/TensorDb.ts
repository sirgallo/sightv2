import { RedisOptions } from 'ioredis';

import { VectorDb } from './Redis.js';


export interface TensorShape {
  dimensions: number[];
}

export interface TensorData {
  k: string;
  v: number[];
  shape: TensorShape;
}

export type TensorMetadata = { [prop: string]: string | number };


export type TensorOperation = 'AI.TENSORSET' | 'AI.TENSORGET';
export type TensorMetadataOperation = 'METADATA.SET' | 'METADATA.GET';

export type TensorDbOperation = TensorOperation | TensorMetadataOperation;
type TensorDbOperationMap = { [op in TensorDbOperation]: op };

export type TensorType = 'DOUBLE' | 'INT' | 'FLOAT';
type TensorTypeMap = { [type in TensorType]: type };


export interface TensorDbOpts {
  dbName: VectorDb;
  redisOpts?: RedisOptions;
}

export interface SetTensorsOpts {
  tensors: TensorData[];
  tensorType: TensorType;
}

export interface GetTensorsOpts {
  keys: TensorData['k'][];
  preprocess?: boolean;
}

export interface SetTensorMetadataOpts {
  k: TensorData['k'];
  meta: TensorMetadata;
}

export interface GetTensorMetadataOpts {
  k: TensorData['k']
}

export type ExecTensorOpts<
    T extends TensorOperation 
    | TensorMetadataOperation
  > =
    T extends 'AI.TENSORSET'
    ? SetTensorsOpts
    : T extends 'AI.TENSORGET'
    ? GetTensorsOpts
    : T extends 'METADATA.SET'
    ? SetTensorMetadataOpts
    : T extends 'METADATA.GET'
    ? GetTensorMetadataOpts
    : never;

export type ExecTensorResponse<
    T extends TensorOperation 
    | TensorMetadataOperation
  > = 
    T extends 'AI.TENSORSET' | 'METADATA.SET'
    ? boolean
    : T extends 'AI.TENSORGET'
    ? TensorData['v']
    : T extends 'METADATA.GET'
    ? TensorMetadata
    : never;


type TensorConstants = {
  OP: TensorDbOperationMap;
  CMD: { [cmd: string]: string };
  PREFIX: { [prefix: string]: string };
  LUA: { [script in TensorOperation]: string };
  TYPE: TensorTypeMap;
}


export const TENSOR_CONSTANTS: TensorConstants = {
  OP: {
    'AI.TENSORSET': 'AI.TENSORSET',
    'AI.TENSORGET': 'AI.TENSORGET',
    'METADATA.SET': 'METADATA.SET',
    'METADATA.GET': 'METADATA.GET'
  },
  CMD: { VALUES: 'VALUES' },
  PREFIX: { METADATA: 'tensor_meta' },
  LUA: {
    'AI.TENSORSET': null,
    'AI.TENSORGET': `
    local results = {}
    for i=1,#KEYS do
      local tensor = redis.call('AI.TENSORGET', KEYS[i], 'VALUES')
      table.insert(results, tensor)
    end
    return results
    `
  },
  TYPE: { DOUBLE: 'DOUBLE', INT: 'INT', FLOAT: 'FLOAT' }
}