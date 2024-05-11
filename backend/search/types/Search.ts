export type SearchRequest<T extends keyof SearchEndpoints> = 
  T extends 'process' 
  ? { modelId: string, query: string }
  : never;

export interface SearchResponse {
  fields: string[];
  rows: any[];
}


export interface SearchEndpoints {
  process(opts: SearchRequest<'process'>): Promise<SearchResponse>;
}