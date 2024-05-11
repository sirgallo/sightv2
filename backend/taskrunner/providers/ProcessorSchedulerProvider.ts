import { scheduleJob } from 'node-schedule';

import { LogProvider } from '../../core/log/LogProvider.js';
import { generateCycleMapForProcessors } from '../utils/Schedule.js';
import { scheduleMap } from '../configs/ScheduleMap.js';


export class ProcessorSchedulerProvider {
  private zLog = new LogProvider(ProcessorSchedulerProvider.name);
  constructor(private cycleMap = generateCycleMapForProcessors(scheduleMap)) {}

  async start() {
    for (const processor of Object.keys(this.cycleMap)) {
      scheduleJob(this.cycleMap[processor], async () => {
        try {
          this.zLog.debug(`scheduling processor of type ${processor}`);
          if (scheduleMap[processor].processor) await scheduleMap[processor].processor.run();
        } catch (err) {
          this.zLog.error(`error scheduling processor ${processor} with error: ${err}`);
          throw err;
        }
      });
    }
  }
}