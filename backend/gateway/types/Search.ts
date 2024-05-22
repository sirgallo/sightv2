import { ISearch } from '../../db/models/Search.js';


export type SearchRequest<T extends keyof SearchEndpoints> = 
  T extends 'create'
  ? Pick<ISearch, 'modelId' | 'searchName' | 'query'>
  : T extends 'update'
  ? { filter: Pick<ISearch, 'searchId'>, update: Omit<ISearch, 'searchId' | 'modelId' | 'createdBy' | 'createdAt' | 'updatedAt'> }
  : T extends 'delete'
  ? Pick<ISearch, 'searchId'>
  : never;

export type SearchResponse = ISearch;
  

export interface SearchEndpoints {
  create: (opts: SearchRequest<'create'>) => Promise<SearchResponse>;
  update: (opts: SearchRequest<'update'>) => Promise<SearchResponse>
  delete: (opts: SearchRequest<'delete'>) => Promise<SearchResponse>;
}