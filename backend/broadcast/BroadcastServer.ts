import { ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';

import { ApplicableSystem } from '../ServerConfigurations.js';
import { Server } from '../server/Server.js';
import { ServerConfiguration } from '../server/types/ServerConfiguration.js';
import { Connection } from '../common/Connection.js';
import { envLoader } from '../common/EnvLoader.js';
import { BroadcastProvider } from './providers/BroadcastProvider.js';


export class BroadcastServer extends Server<ApplicableSystem> {
  constructor(opts: ServerConfiguration<ApplicableSystem>) { 
    super(opts); 
  }

  async initService(): Promise<boolean> {
    this.zLog.info(`${this.name} starting...`);
    return true;
  }

  async startEventListeners (): Promise<void>{
    try {
      const etcdProvider = Connection.etcd();
      etcdProvider.startElection(BroadcastServer.name);
      etcdProvider.on('elected', async elected => {
        try {
          if (elected && envLoader.SIGHT_REDIS_DEPLOYMENT === 'cluster') BroadcastServerProcessor.startCluster();
          if (elected && envLoader.SIGHT_REDIS_DEPLOYMENT !== 'cluster') BroadcastServerProcessor.startClient();
      
        // else BroadcastServerProcessor.redirect();
        } catch (err) { 
          this.zLog.error(err);
          process.exit(1);
        }
      });
    } catch (err) {
      this.zLog.error(err);
      process.exit(1);
    }
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

  static async redirect() {
    // await EtcdAddressRegistry.getAll();
  }
}