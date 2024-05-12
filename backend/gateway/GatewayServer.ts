import { ApplicableSystems } from '../ServerConfigurations.js';
import { Server } from '../server/Server.js';
import { ServerConfiguration } from '../server/types/ServerConfiguration.js';
import { SightMongoProvider } from '../db/SightProvider.js';

import { AccountProvider } from './providers/AccountProvider.js';
import { AuthProvider } from './providers/AuthProvider.js';
import { ModelProvider } from './providers/ModelProvider.js';
import { SavedProvider } from './providers/SavedProvider.js';
import { SourceProvider } from './providers/SourceProvider.js';

import { AccountRoute } from './routes/AccountRoute.js';
import { AuthRoute } from './routes/AuthRoute.js';
import { ModelRoute } from './routes/ModelRoute.js';
import { SavedRoute } from './routes/SavedRoute.js';
import { SourceRoute } from './routes/SourceRoute.js';

import { authRouteMapping } from './configs/AuthRouteMapping.js';
import { accountRouteMapping } from './configs/AccountRouteMapping.js';
import { modelRouteMapping } from './configs/ModelRouteMapping.js';
import { savedRouteMapping } from './configs/SavedRouteMapping.js';
import { sourceRouteMapping } from './configs/SourceRouteMapping.js';


export class GatewayServer extends Server<ApplicableSystems> {
  constructor(opts: ServerConfiguration<ApplicableSystems>) {
    super(opts); 
  }

  async initService(): Promise<boolean> {
    this.zLog.info(`${this.name} starting...`);

    const sightDb = new SightMongoProvider();
    await sightDb.createNewConnection();

    this.zLog.info('connection to sightdb success');
    
    const accountProvider = new AccountProvider(sightDb);
    const authProvider = new AuthProvider(sightDb);
    const modelProvider = new ModelProvider(sightDb);
    const savedProvider = new SavedProvider(sightDb);
    const sourceProvider = new SourceProvider(sightDb);

    this.zLog.info('all providers initialized');

    this.routes = [ 
      new AccountRoute(this.root, accountRouteMapping.account.name, accountProvider),
      new AuthRoute(this.root, authRouteMapping.auth.name, authProvider),
      new ModelRoute(this.root, modelRouteMapping.model.name, modelProvider),
      new SavedRoute(this.root, savedRouteMapping.saved.name, savedProvider),
      new SourceRoute(this.root, sourceRouteMapping.source.name, sourceProvider)
    ];

    return true;
  }

  startEventListeners = () => null;
}