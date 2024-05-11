import { envLoader } from './EnvLoader.js';


export class Profile {
  static getMongoConnectionString(): string {
    const hosts = [ `${envLoader.SIGHT_DB_USER}:${envLoader.SIGHT_DB_PASS}`, envLoader.SIGHT_DB_HOSTS ].join('@');
    const endpoint = [ 'mongodb', hosts ].join('://')
    const suffix = [ 'sight', `replicaset=${envLoader.SIGHT_DB_REPLICA_SET}`].join('?');
    
    return [ endpoint, suffix ].join('/');
  }
}