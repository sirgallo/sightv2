import { SightMongoProvider } from '../../db/SightProvider.js';
import { SearchEndpoints, SearchRequest, SearchResponse } from '../types/Search.js';


export class SearchProvider implements SearchEndpoints {
  constructor(private sightDb: SightMongoProvider) {}

  async process(opts: SearchRequest<'process'>): Promise<SearchResponse> {
    return null;
  }
}