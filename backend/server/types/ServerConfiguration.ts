export interface ServerConfiguration<T extends string> {
  root: `/${string}`; 
  name: `${T} api`;
  port: number;
  numOfCpus: number;
  version: string;
  staticFilesDir?: string;
}