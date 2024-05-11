import { ConnectOptions } from 'mongoose';


export interface MongoCredentials {
  hosts: string[];
  port: number;
  replicationSet?: string;
  db?: string;
  user?: string;
  password?: string;
}

export interface MongoUri { 
  fullUri: string;
}

export interface MongoCreds {
  creds: MongoCredentials;
}

export interface MongoConnection extends Partial<MongoCreds>, Partial<MongoUri> {}
export interface MongoInitOpts {
  connection: MongoConnection;
  overrideOpts?: ConnectOptions;
}