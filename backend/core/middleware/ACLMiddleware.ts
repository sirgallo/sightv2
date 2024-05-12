import { LogProvider } from '../log/LogProvider.js';
import { NodeUtil } from '../utils/Node.js';


export class ACLMiddleware {  
  private zLog = new LogProvider(ACLMiddleware.name);
  
  async validate(): Promise<boolean> {
    return true;
  }
}