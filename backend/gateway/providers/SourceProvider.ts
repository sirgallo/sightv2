import { SightMongoProvider } from '../../db/SightProvider.js';
import { SourceEndpoints, SourceRequest, SourceResponse } from '../types/Source.js';


export class SourceProvider implements SourceEndpoints {
  constructor(private sightDb: SightMongoProvider) {}

  async create(opts: SourceRequest<'create'>): Promise<SourceResponse> {
    return null;
  }

  async update(opts: SourceRequest<'update'>): Promise<SourceResponse> {
    return null;
  }

  async delete(opts: SourceRequest<'delete'>): Promise<SourceResponse> {
    return null;
  }

  async test(opts: SourceRequest<'test'>): Promise<SourceResponse> {
    return null;
  }
}