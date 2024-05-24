import { ApplicableSystem } from '../ServerConfigurations.js';
import { Server } from '../server/Server.js';
import { ServerConfiguration } from '../server/types/ServerConfiguration.js';
import { Connection } from '../common/Connection.js';
import { SightMongoProvider } from '../db/SightProvider.js';

import { AccountProvider } from './providers/AccountProvider.js';
import { AuthProvider } from './providers/AuthProvider.js';
import { ModelProvider } from './providers/ModelProvider.js';
import { SearchProvider } from './providers/SearchProvider.js';
import { SourceProvider } from './providers/SourceProvider.js';

import { AccountRoute } from './routes/AccountRoute.js';
import { AuthRoute } from './routes/AuthRoute.js';
import { ModelRoute } from './routes/ModelRoute.js';
import { SearchRoute } from './routes/SearchRoute.js';
import { SourceRoute } from './routes/SourceRoute.js';

import { authRouteMapping } from './configs/AuthRouteMapping.js';
import { accountRouteMapping } from './configs/AccountRouteMapping.js';
import { modelRouteMapping } from './configs/ModelRouteMapping.js';
import { savedRouteMapping } from './configs/SavedRouteMapping.js';
import { sourceRouteMapping } from './configs/SourceRouteMapping.js';


export class GatewayServer extends Server<ApplicableSystem> {
  private __sightDb: SightMongoProvider;
  constructor(opts: ServerConfiguration<ApplicableSystem>) {
    super(opts); 
  }

  async initService(): Promise<boolean> {
    try {
      this.zLog.info(`${this.name} starting...`);
      this.__sightDb = await Connection.mongo();

      this.zLog.info('connection to sightdb success');
    
      const accountProvider = new AccountProvider(this.__sightDb);
      const authProvider = new AuthProvider(this.__sightDb);
      const modelProvider = new ModelProvider(this.__sightDb);
      const savedProvider = new SearchProvider(this.__sightDb);
      const sourceProvider = new SourceProvider(this.__sightDb);

      this.zLog.info('all providers initialized');

      this.routes = [ 
        new AccountRoute(this.root, accountRouteMapping.account.name, accountProvider),
        new AuthRoute(this.root, authRouteMapping.auth.name, authProvider),
        new ModelRoute(this.root, modelRouteMapping.model.name, modelProvider),
        new SearchRoute(this.root, savedRouteMapping.search.name, savedProvider),
        new SourceRoute(this.root, sourceRouteMapping.source.name, sourceProvider)
      ];

      return true;
    } catch(err) {
      if (this.__sightDb) { 
        await this.__sightDb.closeConnection()
          .catch(e => this.zLog.error(`error closing mongo connection: ${e}`));
      }

      throw err;
    }
  }

  startEventListeners = () => null;
}