import { SightMongoProvider } from '../../db/SightProvider.js';
import { SavedEndpoints, SavedRequest, SavedResponse } from '../types/Saved.js';


export class SavedProvider implements SavedEndpoints {
  constructor(private sightDb: SightMongoProvider) {}

  async create(opts: SavedRequest<'create'>): Promise<SavedResponse> {
    return null;
  }

  async update(opts: SavedRequest<'update'>): Promise<SavedResponse> {
    return null;
  }

  async delete(opts: SavedRequest<'delete'>): Promise<SavedResponse> {
    return null;
  }
}