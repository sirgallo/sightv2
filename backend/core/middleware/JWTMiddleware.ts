import { Response, Request, NextFunction } from 'express';
import jsonwebtoken from 'jsonwebtoken';
const { sign, verify } = jsonwebtoken;

import { LogProvider } from '../log/LogProvider.js';
import { NodeUtil } from '../utils/Node.js';
import { SightMongoProvider } from '../../db/SightProvider.js';
import { IToken } from '../../db/models/User.js';


export class JWTMiddleware {
  private zLog = new LogProvider(JWTMiddleware.name);
  constructor(private opts: JWTOpts) {}
  
  async sign(userId: string): Promise<string> {
    const { secret, timespanInSec } = this.opts;
    const signHelper = () => sign({ id: userId }, secret, { expiresIn: timespanInSec });
    
    return NodeUtil.wrapAsync(signHelper);
  }

  async authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (! authHeader) return res.sendStatus(401);

    const [ scheme, token ] = authHeader.split(' ');
    if (scheme !== 'Bearer' || ! token) return res.sendStatus(401);

    try {
      const { secret } = this.opts;
      const verifyWrapper = () => verify(token, secret);
      const decodedUserId = await NodeUtil.wrapAsync(verifyWrapper);
      
      req['user'] = { userId: decodedUserId as string };
      next();
    } catch (err) {
      if (err instanceof jsonwebtoken.TokenExpiredError) return this.handleRefreshToken(req, res, next, token);
      
      this.zLog.error(`decode error: ${NodeUtil.extractErrorMessage(err)}`)
      return res.sendStatus(403);
    }
  }

  private async handleRefreshToken(req: Request, res: Response, next: NextFunction, token: string) {
    try {
      const sightDb = new SightMongoProvider();
      await sightDb.createNewConnection();

      const userId = await (async (): Promise<string> => {
        const { secret } = this.opts;
        const verifyWrapper = () => verify(token, secret, { ignoreExpiration: true }) as string;
        
        return NodeUtil.wrapAsync(verifyWrapper); // we decode without verifying the expiration here
      })();

      const refreshToken: IToken = await sightDb.token.findOne({ userId });
      if (refreshToken) {
        const newToken = await this.sign(userId);
        
        req.header['authorization'] = `Bearer ${newToken}`;
        req['user'] = { userId };
        
        next();
      } else { throw new Error('no valid refresh token'); }
    } catch(err) {
      this.zLog.error(`refresh token err: ${NodeUtil.extractErrorMessage(err)}`);
      return res.sendStatus(403);
    }
  }
}


export interface JWTOpts {
  secret: string;
  timespanInSec: number;
}