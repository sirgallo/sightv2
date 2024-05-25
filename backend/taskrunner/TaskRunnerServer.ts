import { ApplicableSystem } from '../ServerConfigurations.js';
import { Server } from '../server/Server.js';
import { ServerConfiguration } from '../server/types/ServerConfiguration.js';
import { Connection } from '../common/Connection.js';
import { ProcessorSchedulerProvider } from './providers/ProcessorSchedulerProvider.js';


export class TaskRunnerServer extends Server<ApplicableSystem> {
  constructor(opts: ServerConfiguration<ApplicableSystem>) { 
    super(opts); 
  }

  async initService(): Promise<boolean> {
    this.zLog.info(`${this.name} starting...`);
    return true;
  }

  initListeners() {
    try {
      const etcdProvider = Connection.etcd();
      const schedulerProvider = new ProcessorSchedulerProvider();

      etcdProvider.startElection(TaskRunnerServer.name);
      etcdProvider.on('elected', async elected => {
        try {
          if (elected) schedulerProvider.start();
        } catch (err) {
          this.zLog.error(err);
          process.exit(1);
        }
      });
    } catch (err) {
      this.zLog.error(err);
      throw err;
    }
  };
}