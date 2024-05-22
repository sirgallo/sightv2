import { Schema, Document } from 'mongoose';


export const SearchCollectionName = 'search';


//======================== mongo search interfaces


export interface ISearch {
  searchId: string;
  modelId: string;
  createdBy: string;

  refId: string;  // linked to sourceId on source object
  searchName: string;
  query: string;
  runs: number;

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}


//======================== mongo search schemas


export interface SearchDocument extends ISearch, Document {}

export const SearchSchema: Schema<SearchDocument> = new Schema({
  searchId: { type: String, required: true, unique: true },
  refId: { type: String, required: true, unique: true },
  searchName: { type: String, required: true, unique: true },
  query: { type: String, required: true, unique: false },
  runs: { type: Number, required: true, unique: false }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: SearchCollectionName,
  minimize: false
});


//======================== mongo search indexes


SearchSchema.index({ searchId: 1 });
SearchSchema.index({ createdAt: 1 });
SearchSchema.index({ updatedAt: 1 });