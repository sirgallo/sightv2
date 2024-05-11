import { ISource } from '../../db/models/Source.js';


export type SourceRequest<T extends keyof SourceEndpoints> = 
  T extends 'create'
  ? Pick<ISource, 'orgId' | 'sourceName' | 'sourceEndpoint' | 'sourcePort' | 'sourceVendor'>
  : T extends 'update'
  ? { filter: Pick<ISource, 'sourceId'>, update: Partial<Omit<ISource, 'orgId' | 'sourceId' | 'createdAt' | 'updatedAt'>> }
  : T extends 'delete'
  ? Pick<ISource, 'sourceId'>
  : T extends 'test'
  ? Pick<ISource, 'sourceId'>
  : never;

export type SourceResponse = ISource;
  

export interface SourceEndpoints {
  create: (opts: SourceRequest<'create'>) => Promise<SourceResponse>;
  update: (opts: SourceRequest<'update'>) => Promise<SourceResponse>
  delete: (opts: SourceRequest<'delete'>) => Promise<SourceResponse>;
  test: (opts: SourceRequest<'test'>) => Promise<SourceResponse>;
}