import { writeFileSync } from 'fs';
import { join } from 'path';
import { Cluster, Redis } from 'ioredis';

import { ETCDProvider } from '../core/replication/EtcdProvider.js';
import { RedisProvider } from '../core/data/providers/RedisProvider.js';
import { LogProvider } from '../core/log/LogProvider.js';
import { CryptoUtil } from '../core/utils/Crypto.js';
import { TimerUtil } from '../core/utils/Timer.js';
import { envLoader } from '../common/EnvLoader.js';
import { SightMongoProvider } from '../db/SightProvider.js';
import { SightIORunnerOpts, SightIOResults, DEFAULT_RESULTS_FOLDER } from './sight.io.types.js';


export abstract class SightIORunner<T> {
  protected sightDb: SightMongoProvider;
  protected etcdProvider: ETCDProvider;
  protected redisClient: Cluster | Redis;
  protected zLog = new LogProvider('toolset --> tensor.io');
  
  constructor() {}

  async start(opts?: SightIORunnerOpts<T>): Promise<SightIOResults<T>> {
    try {
      const timer = new TimerUtil('tensor.io');
      
      timer.start('io.run');
      await this.init(opts.connOpts);
      const results = await this.runIO();
      timer.stop('io.run');

      const { start, stop, elapsed } = timer.getResults('io.run');
      return { timestamp: start.toISOString(), durationInMs: elapsed, results }
    } catch (err) { throw err; }
  }

  abstract runIO(): Promise<T>;

  private async init(opts?: SightIORunnerOpts<T>['connOpts']) {
    this.sightDb = new SightMongoProvider();
    this.etcdProvider = (() => {
      if (! opts.etcd) return new ETCDProvider();
      return new ETCDProvider(opts.etcd);
    })();
  }
}


export const sightIORunner = async <T>(opts: SightIORunnerOpts<T>) => {
  const zLog = new LogProvider('io --> sight.io.runner');

  const writeToDisk = (results: SightIOResults<T>) => {
    const now = new Date().toISOString();
    const randHash = CryptoUtil.generateHash({ data: now, algorithm: 'sha256', format: 'hex' })
    const filename = join(DEFAULT_RESULTS_FOLDER, `${(randHash as string)}_${now}.results`);

    zLog.debug(`results output filename: ${filename}`);
    writeFileSync(filename, JSON.stringify(results));
  };
  
  try {
    const results = await opts.ioRunner.start();
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