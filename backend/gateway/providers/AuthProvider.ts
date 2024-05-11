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
  private jwtMiddleware =  new JWTMiddleware({ 
    secret: envLoader.JWT_SECRET, 
    timespanInSec: envLoader.JWT_TIMEOUT 
  });

  private refreshMiddleware =  new JWTMiddleware({ 
    secret: envLoader.JWT_REFRESH_SECRET, 
    timespanInSec: envLoader.JWT_REFRESH_TIMEOUT 
  });

  private zLog = new LogProvider(AuthProvider.name);
  constructor(private sightDb: SightMongoProvider) {}

  async authenticate(opts: AuthRequest<'authenticate'>): Promise<AuthResponse> {
    try {
      const currUser: IUser = await this.sightDb.user.findOne({ email: opts.email });
      if (! currUser) throw new Error('no user exists for email address');

      const passwordsMatch = await CryptoUtil.verifyPassword(opts.password, currUser.password);
      if (! passwordsMatch) throw new Error('incorrect supplied password for user account');

      const token = await this.jwtMiddleware.sign(currUser.userId);
      const refreshToken = await this.refreshMiddleware.sign(currUser.userId);
      await this.sightDb.token.findOneAndUpdate({ userId: currUser.userId }, { $set: { refreshToken } });
      return { token };
    } catch (err) {
      this.zLog.error(err);
      throw err;
    }
  }

  async register(opts: AuthRequest<'register'>): Promise<AuthResponse> {
    try {
      const hash = await CryptoUtil.hashPassword(opts.password, { saltRounds: envLoader.PASSWORD_SALT_ROUNDS });
      const payload: IUser = { ...opts, password: hash };
      const newUser = first(await this.sightDb.user.insertMany([ payload ]));

      const token = await this.jwtMiddleware.sign(newUser.userId);
      const refreshToken = await this.refreshMiddleware.sign(newUser.userId);
      await this.sightDb.token.findOneAndUpdate({ userId: newUser.userId }, { $set: { refreshToken } });
      return { token };
    } catch (err) {
      this.zLog.error(err);
      throw err;
    }
  }
}