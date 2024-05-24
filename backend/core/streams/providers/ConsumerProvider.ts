import lodash from 'lodash';
const { chunk, last } = lodash;

import { LogProvider } from '../../log/LogProvider.js';
import {  
  StreamOpts, ConsumerGroupOpts, ProcessPendingOpts,
  ReadResponse, EntryResponse,
  GroupInfoValueIndexes, PendingValueIndexes, parseNested
} from '../types/Stream.js';
import { StreamProvider } from './StreamProvider.js';


export abstract class ConsumerProvider {
  private __streamProvider: StreamProvider;
  private __zLog = new LogProvider(ConsumerProvider.name);

  constructor(opts: StreamOpts) {
    this.__streamProvider = new StreamProvider(opts);
  }

  abstract startConsumer(): void;
  abstract processor(entry: any): Promise<boolean>;

  async consumeGroup(streamKey: string, consumerGroup: string, opts: ConsumerGroupOpts) { // create a listener that reads and processes messages from a stream denoted by a consumer group
    const listenHandler = async (lastId = '>') => { // ingest incoming messages recursively --> lastId will always be the '>' operator since this denotes id of last delivered message
      const res: ReadResponse = await this.__streamProvider.readGroup(streamKey, consumerGroup, this.__streamProvider.uuid, opts.readOpts, lastId); // blocks until a new incoming message enters stream
      if (res) { 
        const [ _, messages ] = res[0];
        await this.__handleMessage(streamKey, consumerGroup, messages);
      }

      if (opts?.trimOpts) await this.__streamProvider.trimFromLastId(streamKey, consumerGroup, opts.trimOpts);
      await listenHandler();
    };

    try {
      this.__zLog.info(`starting consumer for key ${streamKey}`);

      const exists = await this.__streamProvider.exists(streamKey);

      if (! exists) { 
        this.__zLog.info(`stream does not exist, creating group and empty stream for ${streamKey}`);
        await this.__streamProvider.groupCreate(streamKey, consumerGroup);
      } else {
        const streamInfo = await this.__streamProvider.groupInfo(streamKey);
        if (streamInfo?.length < 1) { 
          this.__zLog.info(`consumer group does not exist, creating consumer group for', ${streamKey}`);
          await this.__streamProvider.groupCreate(streamKey, consumerGroup);
        } else {
          const consumerGroups: string[] = streamInfo.map(group => group[GroupInfoValueIndexes.name]);
          if (! consumerGroups.includes(consumerGroup)) { 
            this.__zLog.info(`consumer group does not exist in consumer groups for stream ${streamKey}...creating`);
            await this.__streamProvider.groupCreate(streamKey, consumerGroup);
          } else { await this.processPending(streamKey, consumerGroup, opts.pendingOpts); }
        }
      }

      this.__zLog.info(`starting from last delivered message in stream for ${streamKey}`);
      await listenHandler();
    } catch (err) {
      this.__zLog.error((err as Error).message);
      throw err;
    }
  }

  private async processPending(streamKey: string, consumerGroup: string, opts: ProcessPendingOpts): Promise<boolean> { //  attempt to process messages that have been delivered but never acknowledged, paginate to avoid memory issues if large set of pending
    const pendingEntries = await this.__streamProvider.pending(streamKey, consumerGroup, { start: opts.start, end: opts.end, COUNT: opts.COUNT });
    if (! pendingEntries || pendingEntries.length < 1) {
      this.__zLog.info(`no pending entries to process on consumer group ${consumerGroup}`);
      return true;
    }
    
    const entryIds = ( (): string[] => { 
      if (pendingEntries.length < opts.COUNT) return pendingEntries.map(pending => pending[PendingValueIndexes.messageId]);
      return pendingEntries.slice(0, -1).map(pending => pending[PendingValueIndexes.messageId]); // up to last id
    })();
    
    const claimedMessages = await this.__streamProvider.claim(streamKey, consumerGroup, this.__streamProvider.uuid, entryIds, opts.minIdleTime);
    await this.__handleMessage(streamKey, consumerGroup, claimedMessages);
    this.__zLog.info(`${claimedMessages.length} pending messages processed.`);

    if (pendingEntries.length < opts.COUNT) { 
      this.__zLog.info(`all pending entries claimed and processed for consumer group ${consumerGroup} on consumer with ${this.__streamProvider.uuid}`);
      return true;
    }

    const lastEntryId = last(pendingEntries)[0];
    await this.processPending(streamKey, consumerGroup, { start: lastEntryId, end: opts.end, COUNT: opts.COUNT, minIdleTime: opts.minIdleTime });
  }

  private async __handleMessage(streamKey: string, consumerGroup: string, res: EntryResponse[]): Promise<boolean> { //  __handleMessage: parse response into json --> process response --> acknowledge message
    for (const [ entryId, entry ] of res) {
      const parsedMessage = this.__parseReadResponse(entry);
      await this.processor(parsedMessage); // perform operation on the parsed message
      await this.__streamProvider.ack(streamKey, consumerGroup, entryId); // acknowledge message after processing -- last delivered set before acknowledge
    }

    return true;
  }

  private __parseReadResponse(redisReadResp: string[]) {
    const chunkedResp = chunk(redisReadResp, 2); // incoming array is [ field1, value1, field2, value2, ... fieldN, valueN ]
    const retObj = {};
    chunkedResp.forEach( (chunk: [string, string]) => retObj[chunk[0]] = parseNested(chunk[1]));
  
    return retObj;
  }
}