import { LogProvider } from '../log/LogProvider.js';
import { NodeUtil } from './Node.js';


const zLog = new LogProvider('exponentialBackoff');
export class BackoffUtil {
  static backoff = async <T extends BackoffRequest>(opts: BackoffOpts<T>): Promise<Response> => {
    try {
      if (opts.depth > opts.retries) throw new Error(`exceeded max retries: ${opts.retries}`);
      return fetch(opts.endpoint, opts.request);
    } catch (err) {
      zLog.error(NodeUtil.extractErrorMessage(err));
      if (opts.depth > opts.retries) throw err;
      
      const updatedTimeout = ((): number => 2 ** (opts.depth - 1) * opts.timeout)();
      await NodeUtil.sleep(updatedTimeout);
  
      zLog.info(`timeout: ${updatedTimeout}ms --> { next depth: ${opts.depth + 1}, max depth: ${opts.retries}`);
      return BackoffUtil.backoff({ ...opts, timeout: updatedTimeout, depth: opts.depth + 1 });
    }
  };
}


export type BackoffRequest = RequestInit | undefined;

export interface BackoffOpts<T extends BackoffRequest> {
  endpoint: string,
  retries: number,
  timeout: number,
  request: T, 
  depth?: number
}