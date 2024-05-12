import lodash from 'lodash';
const { first } = lodash;

import { SightMongoProvider } from '../../db/SightProvider.js';
import { SourceEndpoints, SourceRequest, SourceResponse } from '../types/Source.js';


export class SourceProvider implements SourceEndpoints {
  constructor(private sightDb: SightMongoProvider) {}

  async create(opts: SourceRequest<'create'>): Promise<SourceResponse> {
    const source = first(await this.sightDb.source.insertMany([ opts ]));
    return source;
  }

  async update(opts: SourceRequest<'update'>): Promise<SourceResponse> {
    return this.sightDb.source.findOneAndUpdate(opts.filter, { $set: opts.update }, { new: true });
  }

  async delete(opts: SourceRequest<'delete'>): Promise<SourceResponse> {
    return this.sightDb.source.findOneAndDelete(opts);
  }

  async test(opts: SourceRequest<'test'>): Promise<SourceResponse> {
    const source = await this.sightDb.source.findOne(opts);
    if (! source) throw new Error('no source available for provided sourceId');

    return source;
  }
}