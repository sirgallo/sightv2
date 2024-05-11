import { SightMongoProvider } from '../../db/SightProvider.js';
import { ModelEndpoints, ModelRequest, ModelResponse } from '../types/Model.js';


export class ModelProvider implements ModelEndpoints {
  constructor(private sightDb: SightMongoProvider) {}

  async generate(opts: ModelRequest<'generate'>): Promise<ModelResponse> {
    return null;
  }

  async view(opts: ModelRequest<'view'>): Promise<ModelResponse> {
    return null;
  }

  async update(opts: ModelRequest<'update'>): Promise<ModelResponse> {
    return null;
  }

  async delete(opts: ModelRequest<'delete'>): Promise<ModelResponse> {
    return null;
  }
}