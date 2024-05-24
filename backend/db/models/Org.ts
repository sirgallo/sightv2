import { Schema, Document } from 'mongoose';


export const OrgCollectionName = 'org';

export type Subscription = 'hosted' | 'organization' | 'individual' | 'trial';


//======================== mongo org interfaces


export interface IOrg {
  orgId: string;
  name: string;
  industry: string;

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}


//======================== mongo org schemas


export interface OrgDocument extends IOrg, Document {} // need to extend mongo document for schema to include all mongo document fields
export interface TokenDocument extends IOrg, Document {} // need to extend mongo document for schema to include all mongo document fields

export const OrgSchema: Schema<OrgDocument> = new Schema({
  orgId: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  industry: { type: String, required: true, unique: false },
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: OrgCollectionName,
  minimize: false
});


//======================== mongo org indexes


OrgSchema.index({ orgId: 1 });
OrgSchema.index({ name: 1 });