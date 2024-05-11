import { ISearch } from '../../db/models/Search.js';


export type SavedRequest<T extends keyof SavedEndpoints> = 
  T extends 'create'
  ? Pick<ISearch, 'modelId' | 'searchName' | 'query'>
  : T extends 'update'
  ? { filter: Pick<ISearch, 'searchId'>, update: Omit<ISearch, 'searchId' | 'modelId' | 'createdBy' | 'createdAt' | 'updatedAt'> }
  : T extends 'delete'
  ? Pick<ISearch, 'searchId'>
  : never;

export type SavedResponse = ISearch;
  

export interface SavedEndpoints {
  create: (opts: SavedRequest<'create'>) => Promise<SavedResponse>;
  update: (opts: SavedRequest<'update'>) => Promise<SavedResponse>
  delete: (opts: SavedRequest<'delete'>) => Promise<SavedResponse>;
}