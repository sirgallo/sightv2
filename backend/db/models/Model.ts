import { Schema, Document } from 'mongoose';

export const ModelCollectionName = 'model';
export const EntityCollectionName = 'entity';
export const RelationshipCollectionName = 'relationship';

export type ModelObjectType = 'entity' | 'relationship';
export type RelationshipType = 'directed' | 'undirected';


interface __undirectedRelationship {
  members: string[]; // label field from entity
}

interface __directedRelationship {
  sources: string[]; // label field on entities providing
  dests: string[]; // label field on entities receieving 
}

type __relationship<T extends RelationshipType> = 
  T extends 'directed'
  ? __directedRelationship & { rType: T; }
  : T extends 'undirected'
  ? __undirectedRelationship & { rType: T; }
  : never;

type __propIdPriorityType = 'primary' | 'secondary' | 'n/a';
type __entityProps = { 
  [prop: string]: { 
    type: string;
    optional?: boolean; // default false
    unique?: boolean; // default false
    identifier?: __propIdPriorityType; // default n/a
  }
};

interface __entity {
  label: string;
  props: __entityProps;
  v: number;
}

interface __object<MDL extends ModelObjectType, REL extends RelationshipType | unknown = unknown> {
  objectId: string;
  modelId: string;
  sourceId: string;

  label: string;
  v: number;
  metadata: (
    MDL extends 'entity' 
    ? __entity
    : MDL extends 'relationship'
    ? __relationship<REL extends RelationshipType ? REL : never>
    : never
  );

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}

export interface IEntity extends __object<'entity'> {}
export interface IRelationship<REL extends RelationshipType> extends __object<'relationship', REL> {}


export interface IModel {
  modelId: string;
  orgId: string;
  aclId: string;

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}
//======================== mongo specific schemas


export interface EntityDocument extends IEntity, Document {}
export interface RelationshipDocument extends IRelationship<RelationshipType>, Document {}
export interface ModelDocument extends IModel, Document {}


export const EntitySchema: Schema<EntityDocument> = new Schema({
  objectId: { type: String, required: true, unique: true },
  modelId: { type: String, required: true, unique: false },
  sourceId: { type: String, required: true, unique: false },
  label: { type: String, required: true, unique: true },
  v: { type: Number, required: true, unique: false, default: 0 },
  metadata: { type: Schema.Types.Mixed, required: true, unique: true }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: EntityCollectionName,
  minimize: false
});

export const RelationshipSchema: Schema<RelationshipDocument> = new Schema({
  objectId: { type: String, required: true, unique: true },
  modelId: { type: String, required: true, unique: false },
  sourceId: { type: String, required: true, unique: false },
  label: { type: String, required: true, unique: true },
  v: { type: Number, required: true, unique: false, default: 0 },
  metadata: { type: Schema.Types.Mixed, required: true, unique: true }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: RelationshipCollectionName,
  minimize: false
});

export const ModelSchema: Schema<ModelDocument> = new Schema({
  modelId: { type: String, required: true, unique: true },
  orgId: { type: String, required: true, unique: false },
  aclId: { type: String, required: true, unique: false }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: ModelCollectionName,
  minimize: false
});


//======================== indexes


ModelSchema.index({ modelId: 1 });
ModelSchema.index({ orgId: 1 });
ModelSchema.index({ aclId: 1 });

EntitySchema.index({ objectId: 1 });
EntitySchema.index({ modelId: 1 });
EntitySchema.index({ label: 1 });
EntitySchema.index({ modelId: 1, label: 1, v: 1 });

RelationshipSchema.index({ objectId: 1 });
RelationshipSchema.index({ modelId: 1 });
RelationshipSchema.index({ label: 1 });
RelationshipSchema.index({ modelId1: 1, label: 1, v: 1 });