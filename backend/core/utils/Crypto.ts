import { compare, hash } from 'bcrypt';
import { createHash } from 'crypto';

import { LogProvider } from '../log/LogProvider.js';
import { NodeUtil } from './Node.js';


const zLog = new LogProvider('crypto');
export class CryptoUtil {
  static generateHash = (opts: HashOpts): HashResult => {
    try {
      const hasher = createHash(opts.algorithm);
      hasher.update(opts.data);
      
      if (opts.format === 'bytes') return hasher.digest();
      return hasher.digest(opts.format);
    } catch (err) {
      zLog.error(NodeUtil.extractErrorMessage(err));
      throw err;
    }
  };

  static hashPassword = async (password: string, opts: { saltRounds: number }): Promise<string> => {
    return hash(password, opts.saltRounds); // for salt rounds, higher number will result in higher security 
  }
  
  static verifyPassword = async (password: string, hash: string): Promise<boolean> =>{
    return await compare(password, hash);
  }
}


type CRYPTO_INPUTS = {
  ALGORITHM: 'sha128' | 'sha256';
  FORMAT: 'bytes' | 'hex';
};

export interface HashOpts { 
  data: string; 
  algorithm: CRYPTO_INPUTS['ALGORITHM'];
  format: CRYPTO_INPUTS['FORMAT'];
}

export type HashResult = Buffer | string;