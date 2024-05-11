import { Schema, Document } from 'mongoose';


export const SourceCollectionName = 'source';


export type ApplicableVendors = 'mariaDb' | 'mongoDb' | 'galaxy'

export interface ISource {
  sourceId: string;
  orgId: string;

  sourceName: string;
  sourceEndpoint: string;
  sourceVendor: ApplicableVendors;

  sourcePort?: number;

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}


//======================== mongo specific schemas


export interface SourceDocument extends ISource, Document {}

export const SourceSchema: Schema<SourceDocument> = new Schema({
  sourceId: { type: String, required: true, unique: true },
  orgId: { type: String, required: true, unique: false },
  sourceName: { type: String, required: true, unique: true },
  sourceEndpoint: { type: String, required: true, unique: true },
  sourcePort: { type: Number, required: false, unique: false },
  sourceVendor: { type: String, required: false, unique: false }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: SourceCollectionName,
  minimize: false
});


//======================== indexes


SourceSchema.index({ sourceId: 1 });