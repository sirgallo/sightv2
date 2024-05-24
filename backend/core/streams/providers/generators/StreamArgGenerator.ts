import { RedisValue } from 'ioredis';

import { XAddOpts, XRangeOpts, XReadOpts } from '../../types/Stream.js'


export class StreamArgGenerator { // [ ] denotes optional fields, < > denotes or
  static parseXAddArgs = (args: any[], id: string, opts?: XAddOpts): RedisValue[] => { // MAXLEN [ ~ ] threshold < * | id > field1, value1, ... fieldN, valueN
    const parsed = [];
    if (opts) {
      if (opts?.MAXLEN) {
        parsed.push('MAXLEN');
        if (! opts?.exactLength) parsed.push('~');  // in cases where we do not need exact length. This is faster
        parsed.push(opts?.MAXLEN);
      }
    }
    parsed.push(id, ...args);

    return parsed;
  };

  static parseXReadArgs = (streamKey: string, id: string, opts: XReadOpts): RedisValue[] => { // [ COUNT count ] [ BlOCK millisecs ] STREAMS key id
    const parsedArgs = [];
    Object.keys(opts).forEach( key => {
      const currArg = [ key, opts[key] ];
      parsedArgs.push(...currArg);
    });
  
    const streams = [ 'STREAMS', streamKey, id ];
    parsedArgs.push(...streams);
  
    return parsedArgs;
  };

  static parseXReadGroupArgs = (streamKey: string, id: string, consumerGroup: string, consumerName: string, opts: XReadOpts): RedisValue[] => { // consumerGroup consumerName [ COUNT count ] [ BLOCK millisecs ] STREAMS key id
    const parsedArgs = [];
    const group = [ consumerGroup, consumerName ];
    parsedArgs.push(...group);
    parsedArgs.push(...StreamArgGenerator.parseXReadArgs(streamKey, id, opts));

    return parsedArgs;
  };
  
  static parseXRangeArgs = (opts: XRangeOpts): RedisValue[] => { // key < - | start > < + | end > [ COUNT count ]
    const parsedArgs = [];
  
    if (opts?.exclusiveRange) {
      const prefixStart = (start: string) => `(${start}`;
      parsedArgs.push(prefixStart, opts.end);
    } else { parsedArgs.push(opts.start, opts.end); }
  
    if (opts?.COUNT) { 
      const optionalCount = [ 'COUNT', opts?.COUNT ];
      parsedArgs.push(...optionalCount);
    }
  
    return parsedArgs;
  };

  static parseXTrimArgs = (maxLength: number, exactLength?: boolean): RedisValue[] => { // key MAXLEN [ ~ ] threshold 
    const parsed = [];
    parsed.push('MAXLEN');
    if (! exactLength) parsed.push('~');
    parsed.push(maxLength);
  
    return parsed;
  };

  static parseXClaimArgs = (consumerGroup: string, consumerName: string, ids: string[], minIdleTime?: number): RedisValue[] => { // consumerGroup consumerName minIdleTime ...ids
    const parsed: any[] = [ consumerGroup, consumerName ];
    if (minIdleTime) parsed.push(minIdleTime);
    parsed.push(...ids);

    return parsed;
  };
}