import { ApplicableSystems } from '../ServerConfigurations.js';
import { Server } from '../server/Server.js';
import { ServerConfiguration } from '../server/types/ServerConfiguration.js';
import { Connection } from '../common/Connection.js';
import { ProcessorSchedulerProvider } from './providers/ProcessorSchedulerProvider.js';


export class TaskRunnerServer extends Server<ApplicableSystems> {
  constructor(opts: ServerConfiguration<ApplicableSystems>) { 
    super(opts); 
  }

  async initService(): Promise<boolean> {
    this.zLog.info(`${this.name} starting...`);
    return true;
  }

  async startEventListeners(): Promise<void> {
    const etcdProvider = Connection.etcd();
    const schedulerProvider = new ProcessorSchedulerProvider();

    try {
      etcdProvider.startElection(TaskRunnerServer.name);
      etcdProvider.onElection('elected', async elected => {
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