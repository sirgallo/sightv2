import { Schema, Document } from 'mongoose';


export const ExceptionCollectionName = 'exception';

export type ExceptionOrigin = 'model' | 'search' | 'task';

export const exceptionStatusList = <const>[ 
  'unresolved', 
  'claimed', 
  'resolved' 
];
export type ExceptionStatus = typeof exceptionStatusList[number];


//======================== mongo exception interfaces


export interface IException {
  exceptionId: string;
  refId: string; // either modelId, searchId, or taskId
  origin: ExceptionOrigin;

  status: ExceptionStatus;
  snapshot: { state: string, message: string, origin: string };
  
  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}


//======================== mongo exception schemas


export interface ExceptionDocument extends IException, Document {}

export const ExceptionSchema: Schema<ExceptionDocument> = new Schema({
  exceptionId: { type: String, required: true, unique: true },
  refId: { type: String, required: true, unique: false },
  origin: { type: String, required: true, unique: false }, 
  status: { type: String, required: true, unique: false },
  snapshot: { type: Schema.Types.Mixed, required: true, unique: false }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: ExceptionCollectionName,
  minimize: false
});


//======================== mongo exception indexes


ExceptionSchema.index({ exceptionId: 1 });
ExceptionSchema.index({ refId: 1, createdAt: 1 });
ExceptionSchema.index({ origin:1, refId: 1, createdAt: 1 });