import { Schema, Document } from 'mongoose';

import { UserRole } from './ACL.js';


export const UserCollectionName = 'user';
export const TokenCollectionName = 'token';


export type Subscription = 'hosted' | 'organization' | 'individual' | 'trial';

//======================== mongo user interfaces


export interface IOrg {
  orgId: string;
  name: string;
  industry: string;
  subscription: Subscription;

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}


//======================== mongo user schemas


export interface OrgDocument extends IOrg, Document {} // need to extend mongo document for schema to include all mongo document fields
export interface TokenDocument extends IOrg, Document {} // need to extend mongo document for schema to include all mongo document fields

export const OrgSchema: Schema<OrgDocument> = new Schema({
  orgId: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  industry: { type: String, required: true, unique: false },
  subscription: { type: String, required: true, unique: true }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: UserCollectionName,
  minimize: false
});


//======================== mongo user indexes


OrgSchema.index({ orgId: 1 });
OrgSchema.index({ name: 1 });