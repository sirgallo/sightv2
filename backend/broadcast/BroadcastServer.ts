import { Server as HttpServer } from 'http';
import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

import { ApplicableSystem } from '../ServerConfigurations.js';
import { Server } from '../server/Server.js';
import { ServerConfiguration } from '../server/types/ServerConfiguration.js';
import { BroadcastProvider } from '../core/broadcast/providers/BroadcastProvider.js';
import { envLoader } from '../common/EnvLoader.js';


export class BroadcastServer extends Server<ApplicableSystem> {
  constructor(opts: ServerConfiguration<ApplicableSystem>) { 
    super(opts); 
  }

  async initService(): Promise<boolean> {
    this.zLog.info(`${this.name} starting...`);
    return true;
  }

  async initListeners () {
    try {
      if (envLoader.SIGHT_REDIS_DEPLOYMENT === 'cluster') BroadcastServerProcessor.startCluster(this.server);
      if (envLoader.SIGHT_REDIS_DEPLOYMENT !== 'cluster') BroadcastServerProcessor.startClient(this.server);
    } catch (err) {
      this.zLog.error(err);
      process.exit(1);
    }
  }   
}


class BroadcastServerProcessor {  
  static startCluster(server: HttpServer, opts?: { nodes: ClusterNode[], cluster: ClusterOptions }) {
    new BroadcastProvider(server, { connOpts: opts });
  };

  static startClient(server: HttpServer, opts?: { redis: RedisOptions }) {
    new BroadcastProvider(server, { connOpts: opts });
  };
}