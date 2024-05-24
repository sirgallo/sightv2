import { createConnection, Connection, ClientSession } from 'mongoose';

import { LogProvider } from '../../log/LogProvider.js';
import { MongoOpts } from '../types/Mongo.js';
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

  async createNewConnection(opts?: MongoOpts) {
    try {
      const uri = Profile.mongoConnectionString();
      const connectionOpts = opts?.override 
        ? opts.override
        : { autoIndex: true, autoCreate: true, maxPoolSize: 100, useUnifiedTopology: true, useNewUrlParser: true };

      this.__conn = await createConnection(uri, connectionOpts).asPromise();
      this.initModels();
    } catch (err) {
      this.zLog.error(`error on connection to mongo: ${NodeUtil.extractErrorMessage(err)}`);
      throw err; 
    }
  }

  async closeConnection(): Promise<boolean> {
    await this.__conn.close();
    return true;
  }

  abstract initModels(): void;
}