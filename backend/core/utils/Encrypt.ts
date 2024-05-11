
import { 
  createCipheriv, createDecipheriv,
  BinaryLike, CipherGCMTypes, CipherKey, Encoding 
} from 'crypto';

import { LogProvider } from '../log/LogProvider.js';
import { NodeUtil } from './Node.js';


const zLog = new LogProvider('encryption');
export class EncryptUtil {
  static encrypt = (data: any, opts: EncryptOpts): EncryptResult => {
    try {
      const { cipher, secret, iv } = opts;

      const validatedCipher = EncryptUtil.validateCipher(cipher);
      const ciphergsm = createCipheriv(validatedCipher, secret, iv);
      const encryptedData = `${ciphergsm.update(JSON.stringify(data), ENCODING_MAP['utf-8'], ENCODING_MAP['hex'])}${ciphergsm.final(ENCODING_MAP['hex'])}`;
      
      return { authTag: ciphergsm.getAuthTag().toString(ENCODING_MAP['hex']), encryptedData };
    } catch (err) {
      zLog.error(NodeUtil.extractErrorMessage(err));
      throw err;
    }
  };

  static decrypt = (data: EncryptResult, opts: DecryptOpts): string => {
    try {
      const { cipher, secret, iv } = opts;

      const validatedCipher = EncryptUtil.validateCipher(cipher);
      const deciphergsm = createDecipheriv(validatedCipher, secret, iv );
      deciphergsm.setAuthTag(Buffer.from(data.authTag, ENCODING_MAP['hex']));
  
      return `${deciphergsm.update(data.encryptedData, ENCODING_MAP['hex'], ENCODING_MAP['utf-8'])}${deciphergsm.final(ENCODING_MAP['utf-8'])}`;
    } catch (err) {
      zLog.error(NodeUtil.extractErrorMessage(err));
      throw err;
    }
  };

  private static validateCipher = (cipher?: CipherGCMTypes): CipherGCMTypes => cipher ?? 'aes-256-gcm'; // default to aes-256-gcm
}



export interface EncryptOpts {
  secret: CipherKey;
  iv: BinaryLike;
  cipher?: CipherGCMTypes;
}

export interface EncryptResult {
  authTag: String;
  encryptedData: string;
}

export interface DecryptData {
  data: string;
  authTag: string;
}

export interface DecryptOpts {
  encryptedData: string;
  authTag: string;
  cipher: CipherGCMTypes;
  secret: CipherKey;
  iv: BinaryLike;
}


const ENCODING_MAP: { [encoding in Encoding]?: Encoding } = {
  hex: 'hex',
  'utf-8': 'utf-8',
};