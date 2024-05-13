import { homedir } from 'os';
import { join } from 'path';

import { SightIORunner } from './sight.io.runner.js';


export interface SightIORunnerOpts<T> {
  ioRunner: SightIORunner<T>;
  saveResultsToDisk?: boolean;
}

export interface SightIOResults<T> {
  timestamp: string;
  durationInMs: number;
  results: T;
}


export const DEFAULT_RESULTS_FOLDER = join(homedir(), 'sight/io_results');
export const DEFAULT_IO_BROADCAST_PORT = 1010;