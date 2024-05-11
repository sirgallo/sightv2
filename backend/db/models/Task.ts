import { Schema, Document } from 'mongoose';


export const TaskCollectionName = 'task';
export const TaskHistoryCollectionName = 'taskHistory';
export const TaskExceptionCollectionName = 'taskException';


export const taskStatusList = <const>[
  'Not Started', 
  'In Progress', 
  'Finished', 
  'Failed', 
  'Archived' 
];
export type TaskStatus = typeof taskStatusList[number];

export const taskExceptionList = <const>[ 
  'unresolved', 
  'claimed', 
  'resolved' 
];
export type TaskExceptionStatus = typeof taskExceptionList[number];


type ApplicableValueType = (string | number)[] | string | number | boolean;


//======================== mongo task interfaces


export interface ITask  {
  taskId: string;
  modelId: string;
  createdBy: string;
  orgId: string;

  state: string;
  status: TaskStatus;
  system: string;

  results?: { [result: string]: ApplicableValueType };
  metadata?: { [prop: string]: ApplicableValueType };

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}

export interface ITaskException {
  exceptionId: string;
  taskId: string;
  
  exceptionStatus: TaskExceptionStatus;
  snapshot: { state: string, message: string, origin: string };
  
  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}

export interface ITaskHistory {
  historyId: string;
  taskId: string;

  state: string;
  status: TaskStatus;
  system: string;

  runAudit?: { [key: string]: ApplicableValueType };

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}


//======================== mongo task schemas


export interface TaskDocument extends ITask, Document {}
export interface TaskExceptionDocument extends ITaskException, Document {}
export interface TaskHistoryDocument extends ITaskHistory, Document {}

export const TaskSchema: Schema<TaskDocument> = new Schema({
  taskId: { type: String, required: true, unique: true },
  modelId: { type: String, required: true, unique: false },
  createdBy: { type: String, required: true, unique: false },
  orgId: { type: String, required: true, unique: false },
  state: { type: String, required: true, unique: false },
  status: { type: String, required: true, unique: false },
  system: { type: String, required: true, unique: false },
  results: { type: Schema.Types.Mixed, required: false, unique: false },
  metadata: { type: Schema.Types.Mixed, required: false, unique: false }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: TaskCollectionName,
  minimize: false
});

export const TaskExceptionSchema: Schema<TaskExceptionDocument> = new Schema({
  exceptionId: { type: String, required: true, unique: true },
  taskId: { type: String, required: true, unique: false },
  exceptionStatus: { type: String, required: true, unique: false },
  snapshot: { type: Schema.Types.Mixed, required: true, unique: false }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: TaskExceptionCollectionName,
  minimize: false
});

export const TaskHistorySchema: Schema<TaskHistoryDocument> = new Schema({
  historyId: { type: String, required: true, unique: true },
  taskId: { type: String, required: true, unique: false },
  state: { type: String, required: true, unique: false },
  status: { type: String, required: true, unique: false },
  system: { type: String, required: true, unique: false },
  runAudit: { type: Schema.Types.Mixed, required: false, unique: false }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: TaskHistoryCollectionName,
  minimize: false
});


//======================== mongo task indexes indexes


TaskSchema.index({ taskId: 1 });
TaskSchema.index({ modelId: 1, createdAt: 1 });
TaskSchema.index({ modelId: 1, updatedAt: 1 });
TaskSchema.index({ orgId: 1, createdAt: 1 });
TaskSchema.index({ orgId: 1, updatedAt: 1 });

TaskExceptionSchema.index({ exceptionId: 1 });
TaskExceptionSchema.index({ taskId: 1, createdAt: 1 });
TaskExceptionSchema.index({ taskId: 1, updatedAt: 1 });

TaskHistorySchema.index({ historyId: 1 });
TaskHistorySchema.index({ taskId: 1, createdAt: 1 });