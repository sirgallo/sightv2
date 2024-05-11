import { createConnection, Connection, Schema, ClientSession } from 'mongoose';

import { LogProvider } from '../../log/LogProvider.js';
import { MongoInitOpts } from '../types/Mongo.js';
import { Profile } from '../../../common/Profile.js';
import { NodeUtil } from '../../../core/utils/Node.js';


export const applySession = (session?: ClientSession): { session: ClientSession } => { 
  if (session) return { session }; 
};

export abstract class MongoProvider {
  protected conn: Connection;
  protected zLog = new LogProvider(MongoProvider.name);
  constructor() {}

  addModel = <T>(name: string, mongoSchema: Schema) => this.conn.model<T>(name, mongoSchema);

  async createNewConnection(opts?: MongoInitOpts) {
    try {
      const connectionString = opts.connection?.fullUri 
        ? opts.connection.fullUri
        : Profile.getMongoConnectionString();
      
      const connectionOpts = opts?.overrideOpts 
        ? opts.overrideOpts
        : { autoIndex: true, autoCreate: true, maxPoolSize: 100, useUnifiedTopology: true, useNewUrlParser: true };
      
      const conn = await createConnection(connectionString, connectionOpts).asPromise();
      this.initModels();

      return conn;
    } catch (err) {
      this.zLog.error(`error on connection to mongo: ${NodeUtil.extractErrorMessage(err)}`);
      throw err; 
    }
  }

  abstract initModels(): void;
}