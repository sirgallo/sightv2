import { envLoader } from './EnvLoader.js';


export class Profile {
  static getMongoConnectionString(): string {
    const endpoint = `mongodb://${envLoader.SIGHT_DB_USER}:${envLoader.SIGHT_DB_PASS}@${envLoader.SIGHT_DB_HOSTS}`;
    const db = `sight?replicaset=${envLoader.SIGHT_DB_REPLICA_SET}`;
    return [ endpoint, db ].join('/');
  }
}