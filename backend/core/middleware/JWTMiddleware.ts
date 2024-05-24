import { Response, Request, NextFunction } from 'express';
import jsonwebtoken from 'jsonwebtoken';
const { sign, verify } = jsonwebtoken;

import { LogProvider } from '../log/LogProvider.js';
import { NodeUtil } from '../utils/Node.js';
import { Connection } from '../../common/Connection.js';
import { SightMongoProvider } from '../../db/SightProvider.js';
import { IToken, IUser } from '../../db/models/User.js';


export class JWTMiddleware {
  private zLog = new LogProvider(JWTMiddleware.name);
  constructor(private opts: JWTOpts) {}
  
  async sign(userId: string): Promise<string> {
    const { secret, timespanInSec } = this.opts;
    const signHelper = () => sign({ id: userId }, secret, { expiresIn: timespanInSec });
    
    return NodeUtil.wrapAsync(signHelper);
  }

  async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers['authorization'];
      if (! authHeader) return res.status(401).send({ error: 'no auth header supplied' })

      const [ scheme, token ] = authHeader.split(' ');
      if (scheme !== 'Bearer' || ! token) return res.status(401).send({ error: 'scheme is not bearer for token' });

      const { user, newToken } = await this.verify(token);
      if (newToken) req.header['authorization'] = `Bearer ${newToken}`;

      req['user'] = user;
      next();
    } catch (err) {
      this.zLog.error(`authenticate error: ${NodeUtil.extractErrorMessage(err)}`)
      return res.status(403).send({ error: NodeUtil.extractErrorMessage(err) });
    }
  }

  async verify(token: string, opts?: { ignoreExpiration: true }): Promise<JWTVerifyPayload> {
    let sightDb: SightMongoProvider;
    try {
      const { secret } = this.opts;
      const verifyWrapper = () => verify(token, secret, opts);
      sightDb = await Connection.mongo();

      const { id } = await NodeUtil.wrapAsync(verifyWrapper) as jsonwebtoken.JwtPayload;
      const { userId, displayName, orgId, role }: IUser = await sightDb.user.findOne({ userId: id });
      return { user: { userId, displayName, orgId, role } };
    } catch (err) {
      this.zLog.error(`decode error: ${NodeUtil.extractErrorMessage(err)}`);
      if (err instanceof jsonwebtoken.TokenExpiredError && ! opts) { return this.handleRefreshToken(token, sightDb); }
      throw err;
    }
  }

  private async handleRefreshToken(token: string, sightDb: SightMongoProvider): Promise<JWTVerifyPayload> {
    const { user } = await this.verify(token, { ignoreExpiration: true });
    
    const refreshToken: IToken = await sightDb.token.findOne({ userId: user.userId });
    if (! refreshToken) throw new Error('no valid refresh token');

    const newToken = await this.sign(user.userId);
    return { user, newToken };
  }
}


export interface JWTOpts {
  secret: string;
  timespanInSec: number;
}

export interface JWTVerifyPayload { 
  user: Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'>,
  newToken?: string
}