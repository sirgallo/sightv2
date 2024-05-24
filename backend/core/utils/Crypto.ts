import { compare, hash } from 'bcrypt';
import { BinaryToTextEncoding,  createHash, randomBytes } from 'crypto';

import { LogProvider } from '../log/LogProvider.js';
import { NodeUtil } from './Node.js';


const zLog = new LogProvider('crypto');
export class CryptoUtil {
  static generateHash = (opts: HashOpts): HashResult => {
    try {
      const hasher = createHash(opts.algorithm);
      hasher.update(opts.data, 'utf-8');
      
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

  static generateSecureUUID = () => {
    const bytes = randomBytes(16);

    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    
    const hex = bytes.toString('hex');
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),hex.substring(20, 32)
    ].join('-');
  };
}


type CRYPTO_INPUTS = {
  ALGORITHM: 'sha256';
  FORMAT: BinaryToTextEncoding | 'bytes';
};

export interface HashOpts { 
  data: string; 
  algorithm: CRYPTO_INPUTS['ALGORITHM'];
  format: CRYPTO_INPUTS['FORMAT'];
}

export type HashResult = Buffer | string;