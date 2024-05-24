import { LogProvider } from '../../log/LogProvider.js';
import { NodeUtil } from '../../utils/Node.js';
import { StreamOpts, XAddOpts } from '../types/Stream.js';
import { StreamProvider } from './StreamProvider.js';


export class ProducerProvider {
	private __streamProvider: StreamProvider;
	private __zLog = new LogProvider(ProducerProvider.name);

	private static singleton: ProducerProvider;
  private constructor(opts: StreamOpts<'stream'>) {
		this.__streamProvider = new StreamProvider(opts);
	}

  static getInstance(opts: StreamOpts) {
    if (! ProducerProvider.singleton) {	
      ProducerProvider.singleton = new ProducerProvider(opts);
      ProducerProvider.singleton.__zLog.info(`created singleton stream producer client for prefix: ${opts?.prefix}`);
    }

    return ProducerProvider.singleton;
  }

	async produceMessage<T>(opts: { streamKey: string, value: T, addOpts?: XAddOpts }): Promise<boolean> {
		try {
			await this.__streamProvider.add(opts.streamKey, opts.value, opts.addOpts);
			return true;
		} catch (err) {
			this.__zLog.error(`produce message error: ${NodeUtil.extractErrorMessage(err)}`);
			throw err;
		}
	}
}