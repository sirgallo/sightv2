/*
import { RedisValue } from 'ioredis';
import lodash from 'lodash';
const { first, last } = lodash;

import { RedisProvider } from '../../data/providers/RedisProvider.js';
import { LogProvider } from '../../log/LogProvider.js';
import { CryptoUtil } from '../../utils/Crypto.js';
import { 
  StreamOpts, XAddOpts, XRangeOpts, XReadOpts, TrimFromLastIdOpts, XPendingOpts,
  ReadResponse, StreamInfoResponse, EntryResponse, GroupInfoResponse,
  genFullKey, spreadFields, genLastAcknowledgedKey,
  LAST_ACKNOWLEDGED_FIELD, GroupInfoValueIndexes, StreamInfoValueIndexes, PendingResponse 
} from '../types/Stream.js'
import { StreamUtil } from './StreamUtil.js';
import { StreamArgGenerator } from './generators/StreamArgGenerator.js';


export class StreamProvider {
  private __redisProvider: RedisProvider;
  private __uuid = CryptoUtil.generateSecureUUID();
  private __zLog = new LogProvider(StreamProvider.name);

  constructor(private __opts: StreamOpts<'stream'>) {
    this.__redisProvider = new RedisProvider(this.__opts.connOpts);
  }
  
  get client() {
    if (! this.__opts?.connOpts || 'cluster' in this.__opts.connOpts) { 
      return this.__redisProvider.getCluster({ service: 'stream', db: this.__opts.db });
    } else { return this.__redisProvider.getClient({ service: 'stream', db: this.__opts.db }); } 
  }

  getInstanceId() {
    this.__zLog.info(`current provider uuid: ${this.__uuid}`);
    return this.__uuid;
  }


  async exists(streamKey: string): Promise<boolean> {
    const result = await this.client.exists(StreamUtil.parsePrefixedKey(this.__opts?.prefix, streamKey));
    return result === 1;
  }

  async clearStream(streamKey: string): Promise<boolean> {
    await this.trim(streamKey, 0, true);
    return true;
  }

  async info(streamKey: string): Promise<StreamInfoResponse> {
    return this.client.xinfo('STREAM', StreamUtil.parsePrefixedKey(this.__opts?.prefix, streamKey)) as Promise<StreamInfoResponse>;
  }

  async groupInfo(streamKey: string): Promise<GroupInfoResponse[]> {
    return this.client.xinfo('GROUPS', StreamUtil.parsePrefixedKey(this.__opts?.prefix, streamKey)) as Promise<GroupInfoResponse[]>;
  }

  async groupCreate(streamKey: string, consumerGroup: string): Promise<boolean> {
    await this.client.xgroup('CREATE', StreamUtil.parsePrefixedKey(this.__opts?.prefix, streamKey), consumerGroup, '$', 'MKSTREAM');
    this.__zLog.debug(`created consumer group --> ${consumerGroup}`);
    return true;
  }

  async groupDestroy(streamKey: string, consumerGroups: string[]): Promise<boolean> {
    for (const consumerGroup of consumerGroups) {
      await this.client.xgroup('DESTROY', StreamUtil.parsePrefixedKey(this.__opts?.prefix, streamKey), consumerGroup);
    }
    
    return true;
  }

  async add(streamKey: string, val: any, opts?: XAddOpts, predefinedId = '*'): Promise<string> {
    return this.client.xadd(
      StreamUtil.parsePrefixedKey(this.__opts?.prefix, streamKey), 
      ...StreamArgGenerator.parseXAddArgs(spreadFields(val), predefinedId, opts)
    );
  }

  async read(streamKey: string, opts?: XReadOpts, lastId = '$'): Promise<ReadResponse> {
    return this.client.xread(
      ...StreamArgGenerator.parseXReadArgs(StreamUtil.parsePrefixedKey(this.__opts?.prefix, streamKey), lastId, opts)
    );
  }

  async readGroup(streamKey: string, consumerGroup: string, consumerName: string, opts: XReadOpts, lastId = '>'): Promise<ReadResponse> {
    const prefixedStreamKey = genFullKey(this.streamKeyPrefix, streamKey);
    const parsedArgs = ParseStreamArguments.parseXReadGroupArgs(StreamUtil.parsePrefixedKey(this.__opts?.prefix, streamKey), lastId, consumerGroup, consumerName, opts);
    
    return this.client.xreadgroup(
      'GROUP', 
      ...StreamArgGenerator.parseXReadGroupArgs(StreamUtil.parsePrefixedKey(this.__opts?.prefix, streamKey), lastId, consumerGroup, consumerName, opts)
    );
  }

  async ack(streamKey: string, consumerGroup: string, id: string): Promise<boolean> {
    const prefixedStreamKey = genFullKey(this.streamKeyPrefix, streamKey);
    const lastAckKey = genLastAcknowledgedKey(consumerGroup);
    
    await this.redisClient.xack(prefixedStreamKey, consumerGroup, id);
    
    //  keep track of last acknowledged since redis doesn't already do this
    //  use transaction to ensure that if key is being modified concurrently, skip
    const transaction = this.redisClient.multi();
    transaction.watch(lastAckKey);
    transaction.hset(lastAckKey, LAST_ACKNOWLEDGED_FIELD, id);

    await transaction.exec().catch(err => { this.zLog.error(`unable to set last acknowledged ${err}`); });

    return true;
  }

  async claim(streamKey: string, consumerGroup: string, consumerName: string, ids: string[], minIdleTime?: number): Promise<EntryResponse[]> {
    const prefixedStreamKey = genFullKey(this.streamKeyPrefix, streamKey);
    return this.redisClient.xclaim(prefixedStreamKey, ParseStreamArguments.parseXClaimArgs(consumerGroup, consumerName, ids, minIdleTime));
  }

  async pending(streamKey:string, consumerGroup: string, opts: XPendingOpts): Promise<PendingResponse[]> {
    const prefixedKey = genFullKey(this.streamKeyPrefix, streamKey);
    const count = await (async () => {
      if (opts?.COUNT) return opts.COUNT;
      else { 
        const groupInfos = await this.groupInfo(streamKey);
        if (! groupInfos || groupInfos.length < 1) return 0;

        const groupInfo = groupInfos.filter(group => group[GroupInfoValueIndexes.name] === consumerGroup)[0];
        const pending = groupInfo[GroupInfoValueIndexes.pending];
        return parseInt(pending);
      }
    })();

    return this.redisClient.xpending(prefixedKey, consumerGroup, opts.start, opts.end, count);
  }

  async getLastAcknowledgedId(consumerGroup: string): Promise<string> {
    const lastAckKey = genLastAcknowledgedKey(consumerGroup);
    return this.redisClient.hget(lastAckKey, LAST_ACKNOWLEDGED_FIELD);
  }

  async getLastDeliveredId(streamKey: string, consumerGroup: string): Promise<string> {
    const groupInfo = await this.groupInfo(streamKey);
    const currentGroupInfo = first(groupInfo.filter(group => group[GroupInfoValueIndexes.name] === consumerGroup));

    return currentGroupInfo[GroupInfoValueIndexes.lastDelivered];
  }

  async range(streamKey: string, opts: XRangeOpts): Promise<EntryResponse[]> {
    const prefixedStreamKey = genFullKey(this.streamKeyPrefix, streamKey);
    const parsedArgs = ParseStreamArguments.parseXRangeArgs(opts);
    
    return this.client.xrange(prefixedStreamKey, ...parsedArgs);
  }

  async len(streamKey: string): Promise<number> {
    const prefixedStreamKey = genFullKey(this.streamKeyPrefix, streamKey);
    return this.client.xlen(prefixedStreamKey);
  }

  async del(streamKey: string, ids: string[]): Promise<boolean> {
    await this.client.xdel(StreamUtil.parsePrefixedKey(this.__opts.prefix, streamKey), ...ids);
    return true;
  }

  //  to delete in a range of values, need to paginate over xrange so we don't run into memory issues
  async paginateDelRange(streamKey: string, opts: XRangeOpts): Promise<boolean> {
    const entries = await this.range(streamKey, opts);
    if (! entries || entries.length < 1) return true;
    
    const entryIdsToDelete = ( (): string[] => {
      if (entries.length < opts?.COUNT) return entries.map(entry => entry[0]);
      return entries.slice(0, -1).map(entry => entry[0]);          //  up to last id
    })();

    await this.del(streamKey, entryIdsToDelete);
    if (entries.length < opts?.COUNT) { 
      this.__zLog.info(`paginated delete for ${streamKey} completed.`);
      return true;
    }

    const lastEntryId = last(entries)[0];
    await this.paginateDelRange(streamKey, { start: lastEntryId, end: opts.end, COUNT: opts.COUNT });             //  recursively paginate up to end id
  }

  async trim(streamKey: string, maxLength: number, exactLength = false): Promise<boolean> {
    await this.client.xtrim(StreamUtil.parsePrefixedKey(this.__opts.prefix, streamKey), ...StreamArgGenerator.parseXTrimArgs(maxLength, exactLength));

    return true;
  }

  async trimFromLastId(streamKey: string, consumerGroup: string, opts: TrimFromLastIdOpts): Promise<boolean> {
    const streamLength = await this.len(streamKey) || 0;
    if (streamLength > opts.maxLength) {
      const maxIdToTrim = await (async () => {
        if (opts.lastIdStartPoint === 'lastAcknowledged') return await this.getLastAcknowledgedId(consumerGroup);
        if (opts.lastIdStartPoint === 'lastDelivered') return await this.getLastDeliveredId(streamKey, consumerGroup);
      })();

      const firstEntryId = (await this.info(streamKey))[StreamInfoValueIndexes.firstEntry][0];
      await this.paginateDelRange(streamKey, { start: firstEntryId, end: maxIdToTrim, COUNT: opts.countPerPage });               
    }

    return true;
  }
}
*/