import { IModel } from '../../db/models/Model.js';


export type ModelRequest<T extends keyof ModelEndpoints> = 
  T extends 'generate'
  ? IModel<any, any>
  : T extends 'view'
  ? IModel<any, any>
  : T extends 'update'
  ? IModel<any, any>
  : T extends 'delete'
  ? IModel<any, any>
  : never;

export type ModelResponse = IModel<any, any>;
  

export interface ModelEndpoints {
  generate: (opts: ModelRequest<'generate'>) => Promise<ModelResponse>;
  view: (opts: ModelRequest<'view'>) => Promise<ModelResponse>
  update: (opts: ModelRequest<'update'>) => Promise<ModelResponse>;
  delete: (opts: ModelRequest<'delete'>) =>  Promise<ModelResponse>;
}