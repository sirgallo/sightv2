import { createConnection, Connection, ClientSession } from 'mongoose';

import { LogProvider } from '../../log/LogProvider.js';
import { MongoInitOpts } from '../types/Mongo.js';
import { NodeUtil } from '../../utils/Node.js';
import { Profile } from '../../../common/Profile.js';


export const applySession = (session?: ClientSession): { session: ClientSession } => { 
  if (session) return { session }; 
};

export abstract class MongoProvider {
  protected __conn: Connection;
  protected zLog = new LogProvider(MongoProvider.name);
  constructor() {}

  get conn() { return this.__conn; }

  async createNewConnection(opts?: MongoInitOpts) {
    try {
      const connectionString = opts?.connection?.fullUri 
        ? opts.connection.fullUri
        : Profile.getMongoConnectionString();
      
      const connectionOpts = opts?.overrideOpts 
        ? opts.overrideOpts
        : { autoIndex: true, autoCreate: true, maxPoolSize: 100, useUnifiedTopology: true, useNewUrlParser: true };
      
      this.__conn = await createConnection(connectionString, connectionOpts).asPromise();
      this.initModels();
    } catch (err) {
      console.log('error:', err);
      this.zLog.error(`error on connection to mongo: ${NodeUtil.extractErrorMessage(err)}`);
      throw err; 
    }
  }

  abstract initModels(): void;
}