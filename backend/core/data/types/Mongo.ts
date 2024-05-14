import { ConnectOptions } from 'mongoose';


export interface MongoUri { 
  fullUri: string;
}

export interface MongoOpts {
  io: boolean;
  override?: ConnectOptions;
}