import { ScheduleMap } from '../types/Scheduler.js';


export const scheduleMap: ScheduleMap = {
  taskrunner: {
    timeMap: {
      hours: { start: 0, end: 23, step: 1 },
      minutes: { start: 0, end: 59, step: 1 },
      seconds: 0
    },
    processor: null
  }
};