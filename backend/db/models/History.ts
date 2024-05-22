import { Schema, Document } from 'mongoose';


export const HistoryCollectionName = 'history';

export const historyStatusList = <const>[
  'Not Started', 
  'In Progress', 
  'Finished', 
  'Failed', 
  'Archived' 
];
export type HistoryStatus = typeof historyStatusList[number];

export type HistoryOrigin = 'model' | 'search' | 'task';

type ApplicableValueType = (string | number)[] | string | number | boolean;


//======================== mongo history interfaces


export interface IHistory {
  historyId: string;
  refId: string; // either modelId, searchId, or taskId
  origin: HistoryOrigin;

  state: string;
  status: HistoryStatus;
  system: string;

  runAudit?: { [key: string]: ApplicableValueType };

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}


//======================== mongo history schemas


export interface HistoryDocument extends IHistory, Document {}

export const HistorySchema: Schema<HistoryDocument> = new Schema({
  historyId: { type: String, required: true, unique: true },
  refId: { type: String, required: true, unique: false },
  origin: { type: String, required: true, unique: false },
  state: { type: String, required: true, unique: false },
  status: { type: String, required: true, unique: false },
  system: { type: String, required: true, unique: false },
  runAudit: { type: Schema.Types.Mixed, required: false, unique: false }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: HistoryCollectionName,
  minimize: false
});


//======================== mongo history indexes


HistorySchema.index({ historyId: 1 });
HistorySchema.index({ refId: 1, createdAt: 1 });
HistorySchema.index({ origin: 1, refId: 1, createdAt: 1 });