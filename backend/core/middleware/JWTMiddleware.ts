import { Response, Request, NextFunction } from 'express';
import jsonwebtoken from 'jsonwebtoken';
const { sign, verify } = jsonwebtoken;

import { LogProvider } from '../log/LogProvider.js';
import { NodeUtil } from '../utils/Node.js';


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
      const wrapper = () => verify(token, secret);
      const decodedUserId = await NodeUtil.wrapAsync(wrapper);
      
      req['user'] = { userId: decodedUserId as string };
      next();
    } catch (err) {
      this.zLog.error(`decode error: ${NodeUtil.extractErrorMessage(err)}`)
      return res.sendStatus(403);
    }
  }
}


export interface JWTOpts {
  secret: string;
  timespanInSec: number;
}