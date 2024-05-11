import { EtcdModel } from '../../../core/replication/EtcdModel.js';
import { InferType } from '../../../core/types/Infer.js';
import { ISODateString } from '../../../core/types/ISODate.js';


export type AuditKeyPrefix<T extends Action> = `audit/${T}`;
export type AuditKeySuffix = ISODateString;

export type PreProcessorAction = 'calculateStats';
export type TraderAction = 'live' | 'livesim' | 'historicalsim';
export type PostProcessorAction = 'updaterisk' | 'updateperformance';
export type Status = 'In Progress' | 'Finished' | 'Failed'

export type Action = 
  TraderAction 
  | PreProcessorAction 
  | PostProcessorAction;

export interface AuditAction<T extends Action, V>{
  action: InferType<T>;
  payload: InferType<V>;
}

export interface AuditEntry<V> {
  action: AuditAction<Action, V>;
  auditEntrySource: string;
  timestamp: ISODateString;
}

export type AuditModel<V> = EtcdModel<AuditEntry<V>, AuditKeySuffix, AuditKeyPrefix<Action>>;