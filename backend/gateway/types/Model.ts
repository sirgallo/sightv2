import { IEntity, IModel, IRelationship, RelationshipType } from '../../db/models/Model.js';


interface ModelGenerateRequest<T extends RelationshipType> { 
  model: Pick<IModel,'orgId' | 'aclId'>;
  entities: Pick<IEntity, 'label' | 'metadata' | 'sourceId'>[];
  relationships: Pick<IRelationship<T>, 'label' | 'metadata' | 'sourceId'>[];
}

interface ModelUpdateRequest<T extends RelationshipType> {
  model: Pick<IModel, 'modelId'>;
  updatePayload: {
    remove: {
      entities: Pick<IEntity, 'objectId'>[];
      relationships: Pick<IRelationship<T>, 'objectId'>[];
    };
    update: {
      entities: Partial<Pick<IEntity, 'objectId' | 'label' | 'metadata' | 'sourceId'>>[];
      relationships: Partial<Pick<IRelationship<T>, 'objectId' | 'label' | 'metadata' | 'sourceId'>>[];
    };
    add: {
      entities: Pick<IEntity, 'label' | 'metadata' | 'sourceId'>[];
      relationships: Pick<IRelationship<T>, 'label' | 'metadata' | 'sourceId'>[];
    };
  };
}

export type ModelRequest<END extends keyof ModelEndpoints, REL extends RelationshipType> = 
  END extends 'generate'
  ? ModelGenerateRequest<REL>
  : END extends 'view'
  ? Pick<IModel, 'modelId'>
  : END extends 'update'
  ? ModelUpdateRequest<REL>
  : END extends 'delete'
  ? Pick<IModel, 'modelId'>
  : never;

interface ModelDataResponse<T extends RelationshipType> extends IModel {
  entities: IEntity[];
  relationships: IRelationship<T>[];
}

interface ModelDeleteResponse {
  modelId: string;
  count: { entity: number, relationship: number };
}

export type ModelResponse<END extends keyof ModelEndpoints, REL extends RelationshipType> = 
  END extends 'delete' 
  ? ModelDeleteResponse
  : ModelDataResponse<REL>;
  

export interface ModelEndpoints {
  generate: <T extends RelationshipType>(opts: ModelRequest<'generate', T>) => Promise<ModelResponse<'generate', T>>;
  view: <T extends RelationshipType>(opts: ModelRequest<'view', T>) => Promise<ModelResponse<'view', T>>;
  update: <T extends RelationshipType>(opts: ModelRequest<'update', T>) => Promise<ModelResponse<'update', T>>;
  delete: <T extends RelationshipType>(opts: ModelRequest<'delete', T>) =>  Promise<ModelResponse<'delete', T>>;
}