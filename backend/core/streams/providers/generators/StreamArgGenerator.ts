import { RedisKey, RedisValue } from 'ioredis';

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

  static parseXReadArgs = (
    streamKey: string, id: string, opts: XReadOpts
  ): [ streamsToken: 'STREAMS', ...args: RedisValue[] ] => { // [ COUNT count ] [ BlOCK millisecs ] STREAMS key id
    const readOpts = Object.entries(opts).reduce((acc, entry) => { 
      acc.push(...entry);
      return acc;
    }, []);

    const parsedArgs: [ streamsToken: 'STREAMS', ...args: RedisValue[] ] = [
      'STREAMS', streamKey, id, ...readOpts
    ];
  
    return parsedArgs;
  };

  static parseXReadGroupArgs = (
    streamKey: string, id: string, consumerGroup: string, consumerName: string, opts: XReadOpts
  ): [ group: string | Buffer, consumer: string | Buffer, streamsToken: 'STREAMS', ...args: RedisValue[] ] => { // consumerGroup consumerName [ COUNT count ] [ BLOCK millisecs ] STREAMS key id
    const parsedArgs: [ group: string | Buffer, consumer: string | Buffer, streamsToken: 'STREAMS', ...args: RedisValue[] ] = [
      consumerGroup, consumerName, ...StreamArgGenerator.parseXReadArgs(streamKey, id, opts)
    ];

    return parsedArgs;
  };
  
  static parseXRangeArgs = (
    opts: XRangeOpts
  ): [ start: string | number | Buffer, end: string | number | Buffer ] => { // key < - | start > < + | end > [ COUNT count ]
    const parsedArgs = ((): [ start: string | number | Buffer, end: string | number | Buffer ] => {
      if (opts?.exclusiveRange) {
        const prefixStart = ((start: string) => `(${start}`)(opts.start);
        return [ prefixStart, opts.end ];
      }

      return [ opts.start, opts.end ];
    })();
   
  
    if (opts?.COUNT) { 
      const optionalCount = [ 'COUNT', opts?.COUNT ];
      parsedArgs.push(...optionalCount);
    }
  
    return parsedArgs;
  };

  static parseXTrimArgs = (maxLength: number): [ maxlen: 'MAXLEN', threshold: string | number | Buffer ] => { // key MAXLEN [ ~ ] threshold 
    const parsed: [ maxlen: 'MAXLEN', threshold: string | number | Buffer ] = [
      'MAXLEN', maxLength
    ];

    return parsed;
  };

  static parseXClaimArgs = (
    consumerGroup: string, consumerName: string, ids: string[], minIdleTime: number
  ): [ group: string | Buffer, consumer: string | Buffer, minIdleTime: string | number | Buffer, ...ids: (string | number | Buffer)[] ] => { // consumerGroup consumerName minIdleTime ...ids
    
    const parsed: [ group: string | Buffer, consumer: string | Buffer, minIdleTime: string | number | Buffer, ...ids: (string | number | Buffer)[] ] = [ 
      consumerGroup, consumerName, minIdleTime.toString(), ...ids
    ];

    return parsed;
  };
}