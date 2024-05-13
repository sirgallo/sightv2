import { LogProvider } from '../log/LogProvider.js';
import { NodeUtil } from './Node.js';


const zLog = new LogProvider('exponentialBackoff');
export class BackoffUtil {
  static attempt = async <T extends BackoffRequest>(opts: BackoffOpts<T>): Promise<Response> => {
    try {
      if (opts.depth > opts.retries) throw new Error(`exceeded max retries: ${opts.retries}`);
      return fetch(opts.endpoint, opts.request);
    } catch (err) {
      zLog.error(NodeUtil.extractErrorMessage(err));
      if (opts.depth > opts.retries) throw err;
      
      const updatedTimeout = BackoffUtil.strategy(opts.depth, opts.timeout);
      await NodeUtil.sleep(updatedTimeout);
  
      zLog.info(`timeout: ${updatedTimeout}ms --> { next depth: ${opts.depth + 1}, max depth: ${opts.retries}`);
      return BackoffUtil.attempt({ ...opts, timeout: updatedTimeout, depth: opts.depth + 1 });
    }
  };

  static strategy = (timeout: number, depth = 0): number => { 
    const nextTimeout = 2 ** (depth - 1) * timeout;
    return Math.min(nextTimeout, MAX_TIMEOUT_IN_MS); // set a ceiling on max time, 5 seconds seems reasonable
  }
}


export type BackoffRequest = RequestInit | undefined;

export interface BackoffOpts<T extends BackoffRequest> {
  endpoint: string;
  retries: number;
  timeout: number;
  request: T;
  depth?: number;
}


const MAX_TIMEOUT_IN_MS = 2500