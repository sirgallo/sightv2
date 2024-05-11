import { DBMap } from './models/Configure.js';


type DBName = 'sight';
export const dbConf: DBMap<DBName> = {
  sight: {
    name: 'sight',
    collections: {
      search: 'search',
      source: 'source',
      token: 'token',
      user: 'user',
      task: 'task',
      taskHistory: 'taskHistory',
      taskException: 'taskException'
    }
  }
};