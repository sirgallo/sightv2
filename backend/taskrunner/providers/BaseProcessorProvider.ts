import { ETCDProvider } from '../../core/replication/EtcdProvider.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { AuditProvider } from '../../common/etcd/AuditProvider.js';
import { AuditModel } from '../../common/etcd/models/Audit.js';
import { envLoader } from '../../common/EnvLoader.js';


export abstract class BaseProcessorProvider {
  protected etcProvider: ETCDProvider;
  protected zLog: LogProvider;

  private auditProvider: AuditProvider;

  constructor(protected name: string) { 
    this.zLog = new LogProvider(this.name); 
  }

  abstract initInternalProviders(): boolean;
  abstract process<T>(): Promise<AuditModel<T>['ValueType']['action']>;

  private init() {
    this.etcProvider = new ETCDProvider();
    this.auditProvider = new AuditProvider(this.etcProvider);
    this.initInternalProviders();
  }

  async run(): Promise<boolean> {
    try {
      this.zLog.debug(`initializing and running processor for ${this.name}`)
      
      this.init();
      const payload = await this.process();
      if (payload) await this.auditProvider.insertAuditEntry({ action: payload });

      return true;
    } catch (err) {
      this.zLog.error(`error on processor file: ${err}`);
      throw err;
    }
  }
}