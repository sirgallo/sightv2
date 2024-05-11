import { Schema, Document } from 'mongoose';


export const SourceCollectionName = 'model';

export type ModelObjectType = 'entity' | 'relationship';
export type RelationshipType = 'directed' | 'undirected';

interface __undirectedRelationship {
  members: { [entityId: string]: string };
}

interface __directedRelationship {
  sources: { [entityId: string]: string };
  dests: { [entityId: string]: string };
}

interface __relationshipBase {
  label: string;
  v: number;
}

type __relationship<T extends RelationshipType> = 
  T extends 'directed'
  ? __relationshipBase & __directedRelationship
  : T extends 'undirected'
  ? __relationshipBase & __undirectedRelationship
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

interface __entity<T extends RelationshipType> {
  props: __entityProps;
  relationships: { [oId: string]: __relationship<T> };
}

export interface __modelObject<MDL extends ModelObjectType, REL extends RelationshipType> {
  oId: string;
  orgId: string;
  modelId: string;

  oType: MDL;
  rType: REL;

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}


export type IModel<MDL extends ModelObjectType, REL extends RelationshipType> = 
  MDL extends 'entity' 
  ? __modelObject<MDL, REL> & __entity<REL>
  : MDL extends 'relationship'
  ? __modelObject<MDL, REL> & __relationship<REL>
  : never;

//======================== mongo specific schemas


export interface ModelDocument extends Document {}

export const ModelSchema: Schema<ModelDocument> = new Schema({
  
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: SourceCollectionName,
  minimize: false
});


//======================== indexes


ModelSchema.index({ sourceId: 1 });