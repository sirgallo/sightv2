import { LogProvider } from "core/log/LogProvider";
import { SightIODataOpts } from "./sight.io.types";

export abstract class SightIOLoader {
  abstract load(): Promise<boolean>;
}

export const sightIOData = async <T>(opts: SightIODataOpts<T>) => {
  const zLog = new LogProvider('toolset --> tensor.io.runner');

  try {
    const results = await opts..start();
    zLog.info(`results --> ${JSON.stringify(results, null, 2)}`);
    if (opts.saveResultsToDisk) { 
      zLog.debug('writing results to disk...');
      writeToDisk(results);
    }

    zLog.info('FINISHED');
    process.exit(0);
  } catch (err) {
    zLog.error(`error on run: ${err}`);
    process.exit(1);
  }
};