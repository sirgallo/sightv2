import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

import { ApplicableSystems } from '../ServerConfigurations.js';
import { Server } from '../server/Server.js';
import { ServerConfiguration } from '../server/types/ServerConfiguration.js';
import { ETCDProvider } from '../core/replication/EtcdProvider.js';
import { envLoader } from '../common/EnvLoader.js';
import { BroadcastProvider } from './providers/BroadcastProvider.js';


export class BroadcastServer extends Server<ApplicableSystems> {
  constructor(opts: ServerConfiguration<ApplicableSystems>) { 
    super(opts); 
  }

  async initService(): Promise<boolean> {
    this.zLog.info(`${this.name} starting...`);
    return true;
  }

  async startEventListeners(): Promise<void> {
    const etcdProvider = new ETCDProvider();
    etcdProvider.startElection(BroadcastServer.name);
    etcdProvider.onElection('elected', async elected => {
      try {
        if (elected) {
          if (envLoader.SIGHT_REDIS_DEPLOYMENT === 'cluster') BroadcastServerProcessor.startCluster();
          else BroadcastServerProcessor.startClient();
        }
      } catch (err) { 
        this.zLog.error(err);
        process.exit(1);
      }
    });
  }
}


class BroadcastServerProcessor {  
  static async startCluster(opts?: { nodes: ClusterNode[], cluster: ClusterOptions }) {
    const broadcastProvider = new BroadcastProvider({ connOpts: opts });
    broadcastProvider.listen();
  };

  static async startClient(opts?: { redis: RedisOptions }) {
    const broadcastProvider = new BroadcastProvider({ connOpts: opts });
    broadcastProvider.listen();
  };
}