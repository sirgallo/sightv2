import { homedir } from 'os';
import { join } from 'path';
import { IOptions } from 'etcd3';
import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

import { MongoInitOpts } from '../core/data/types/Mongo.js';
import { SightIO } from './sight.io.runner.js';


export interface SightIODataOpts<T> {
  ioData: SightIO<T>;
  saveResultsToDisk?: boolean;
  connOpts?: {
    db?:  MongoInitOpts;
    etcd?: IOptions;
    redis?: { redis: RedisOptions } | { nodes: ClusterNode[], cluster: ClusterOptions }, 
  };
}

export interface SightIORunnerOpts<T> {
  ioRunner: SightIO<T>;
  saveResultsToDisk?: boolean;
  connOpts?: {
    db?:  MongoInitOpts;
    etcd?: IOptions;
    redis?: { redis: RedisOptions } | { nodes: ClusterNode[], cluster: ClusterOptions }, 
  };
}

export interface SightIOResults<T> {
  timestamp: string;
  durationInMs: number;
  results: T;
}


export const DEFAULT_RESULTS_FOLDER = join(homedir(), 'tensor/results');