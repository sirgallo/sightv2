import { ETCDProvider } from '../../core/replication/EtcdProvider.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { Connection } from '../../common/Connection.js';


export abstract class BaseProcessorProvider {
  protected etcProvider: ETCDProvider;
  protected zLog: LogProvider;

  constructor(protected name: string) { 
    this.zLog = new LogProvider(this.name); 
  }

  abstract initInternalProviders(): boolean;
  abstract process<T>(): Promise<T>;

  private init() {
    this.etcProvider = Connection.etcd();
    this.initInternalProviders();
  }

  async run(): Promise<boolean> {
    try {
      this.zLog.debug(`initializing and running processor for ${this.name}`)
      
      this.init();
      const payload = await this.process();
      return true;
    } catch (err) {
      this.zLog.error(`error on processor file: ${err}`);
      throw err;
    }
  }
}