import { ApplicableSystems } from '../ServerConfigurations.js';
import { Server } from '../server/Server.js';
import { ServerConfiguration } from '../server/types/ServerConfiguration.js';
import { Connection } from '../common/Connection.js';
import { SearchProvider } from './providers/SearchProvider.js';
import { SearchRoute } from './routes/SearchRoute.js';
import { searchRouteMapping } from './configs/SearchRouteMapping.js';


export class SearchServer extends Server<ApplicableSystems> {
  constructor(opts: ServerConfiguration<ApplicableSystems>) { 
    super(opts); 
  }

  async initService(): Promise<boolean> {
    this.zLog.info(`${this.name} starting...`);

    const sightDb = await Connection.mongo();
    const searchProvider = new SearchProvider(sightDb);
    
    this.routes = [ new SearchRoute(this.root, searchRouteMapping.auth.name, searchProvider) ];
    
    return true;
  }

  startEventListeners = async (): Promise<void> =>  null;
}