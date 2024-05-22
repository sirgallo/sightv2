import lodash from 'lodash';
const { first } = lodash;

import { SightMongoProvider } from '../../db/SightProvider.js';
import { SearchEndpoints, SearchRequest, SearchResponse } from '../types/Search.js';


export class SearchProvider implements SearchEndpoints {
  constructor(private sightDb: SightMongoProvider) {}

  async create(opts: SearchRequest<'create'>): Promise<SearchResponse> {
    const savedSearch = first(await this.sightDb.search.insertMany([ opts ]));
    return savedSearch;
  }

  async update(opts: SearchRequest<'update'>): Promise<SearchResponse> {
    return this.sightDb.search.findOneAndUpdate(opts.filter, { $set: opts.update }, { new: true });
  }

  async delete(opts: SearchRequest<'delete'>): Promise<SearchResponse> {
    return this.sightDb.search.findOneAndUpdate(opts);
  }
}