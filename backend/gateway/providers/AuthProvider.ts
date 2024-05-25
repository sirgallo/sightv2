import lodash from 'lodash';
const { first } = lodash;

import { JWTMiddleware } from '../../core/middleware/JWTMiddleware.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { CryptoUtil } from '../../core/utils/Crypto.js'
import { envLoader } from '../../common/EnvLoader.js';
import { SightMongoProvider } from '../../db/SightProvider.js';
import { IUser } from '../../db/models/User.js';
import { AuthEndpoints, AuthRequest, AuthResponse } from '../types/Auth.js';


export class AuthProvider implements AuthEndpoints {
  private __jwtMiddleware =  new JWTMiddleware({ 
    secret: envLoader.JWT_SECRET, 
    timespanInSec: envLoader.JWT_TIMEOUT 
  });

  private __refreshMiddleware =  new JWTMiddleware({ 
    secret: envLoader.JWT_REFRESH_SECRET, 
    timespanInSec: envLoader.JWT_REFRESH_TIMEOUT 
  });

  private __zLog = new LogProvider(AuthProvider.name);
  constructor(private __sightDb: SightMongoProvider) {}

  async authenticate(opts: AuthRequest<'authenticate'>): Promise<AuthResponse> {
    try {
      const currUser: IUser = await this.__sightDb.user.findOne({ email: opts.email });
      if (! currUser) throw new Error('no user exists for email address');

      const passwordsMatch = await CryptoUtil.verifyPassword(opts.password, currUser.password);
      if (! passwordsMatch) throw new Error('incorrect supplied password for user account');

      const token = await this.__jwtMiddleware.sign(currUser.userId);
      const refreshToken = await this.__refreshMiddleware.sign(currUser.userId);
      await this.__sightDb.token.findOneAndUpdate({ userId: currUser.userId }, { $set: { refreshToken } });
      return { token };
    } catch (err) {
      this.__zLog.error(err);
      throw err;
    }
  }

  async register(opts: AuthRequest<'register'>): Promise<AuthResponse> {
    try {
      const hash = await CryptoUtil.hashPassword(opts.password, { saltRounds: envLoader.PASSWORD_SALT_ROUNDS });
      const payload: IUser = { 
        userId: CryptoUtil.generateSecureUUID(),
        password: hash,
        email: opts.email,
        displayName: opts.displayName,
        phone: opts.phone
      };

      const newUser = first(await this.__sightDb.user.insertMany([ payload ]));
      const token = await this.__jwtMiddleware.sign(newUser.userId);
      const refreshToken = await this.__refreshMiddleware.sign(newUser.userId);
      await this.__sightDb.token.findOneAndUpdate({ userId: newUser.userId }, { $set: { refreshToken } });

      return { token };
    } catch (err) {
      this.__zLog.error(err);
      throw err;
    }
  }
}