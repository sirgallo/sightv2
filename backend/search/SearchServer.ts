import { ApplicableSystems } from '../ServerConfigurations.js';
import { Server } from '../server/Server.js';
import { ServerConfiguration } from '../server/types/ServerConfiguration.js';
import { SightMongoProvider } from '../db/SightProvider.js';
import { dbConf } from '../db/DbConf.js';

import { SearchProvider } from './providers/SearchProvider.js';
import { SearchRoute } from './routes/SearchRoute.js';
import { searchRouteMapping } from './configs/SearchRouteMapping.js';


export class SearchServer extends Server<ApplicableSystems> {
  constructor(opts: ServerConfiguration<ApplicableSystems>) { 
    super(opts); 
  }

  async initService(): Promise<boolean> {
    this.zLog.info(`${this.name} starting...`);

    const sightDb = new SightMongoProvider();
    await sightDb.createNewConnection();
    
    const searchProvider = new SearchProvider(sightDb);
    
    this.routes = [ new SearchRoute(this.root, searchRouteMapping.auth.name, searchProvider) ];
    
    return true;
  }

  startEventListeners = async (): Promise<void> =>  null;
}