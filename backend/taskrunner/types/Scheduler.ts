import { Range } from 'node-schedule';

import { BaseProcessorProvider } from '../providers/BaseProcessorProvider.js';


export type RecurrenceRule<T extends 1 | 2 | 3 = undefined> = 
  T extends undefined
  ? ({ start: number, end: number, step?: number } | { step: number } | number)
  : T extends 1 
  ? { start: number, end: number, step?: number } 
  : T extends 2
  ? { step: number } 
  : number;

export interface InitTimeMap {
  month?: RecurrenceRule;
  dayOfMonth?: RecurrenceRule;
  dayOfWeek?: RecurrenceRule;
  hours?: RecurrenceRule;
  minutes?: RecurrenceRule;
  seconds?: RecurrenceRule; 
}

export interface NodeScheduleTimeMap {
  month?: Range | number;
  dayOfMonth?: Range | number;
  dayOfWeek?: Range | number;
  hour: Range | number;
  minute: Range | number;
  second: Range | number;
}

export type ScheduleMap = { 
  [key: string]: { timeMap: InitTimeMap, processor: BaseProcessorProvider }
};