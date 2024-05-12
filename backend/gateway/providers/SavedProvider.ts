import lodash from 'lodash';
const { first } = lodash;

import { SightMongoProvider } from '../../db/SightProvider.js';
import { SavedEndpoints, SavedRequest, SavedResponse } from '../types/Saved.js';


export class SavedProvider implements SavedEndpoints {
  constructor(private sightDb: SightMongoProvider) {}

  async create(opts: SavedRequest<'create'>): Promise<SavedResponse> {
    const savedSearch = first(await this.sightDb.search.insertMany([ opts ]));
    return savedSearch;
  }

  async update(opts: SavedRequest<'update'>): Promise<SavedResponse> {
    return this.sightDb.search.findOneAndUpdate(opts.filter, { $set: opts.update }, { new: true });
  }

  async delete(opts: SavedRequest<'delete'>): Promise<SavedResponse> {
    return this.sightDb.search.findOneAndUpdate(opts);
  }
}