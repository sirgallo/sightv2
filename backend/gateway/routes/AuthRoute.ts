import { Request, Response, NextFunction } from 'express';

import { Route, RouteReqOpts, RouteRequestValidators } from '../../server/Route.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { AuthProvider } from '../providers/AuthProvider.js';
import { AuthEndpoints, AuthRequest } from '../types/Auth.js';
import { authRouteMapping } from '../configs/AuthRouteMapping.js';


export class AuthRoute<T extends keyof AuthEndpoints, V extends AuthRequest<T>> extends Route<T, V> {
  private zLog: LogProvider = new LogProvider(AuthRoute.name);

  constructor(basePath: string, routePath: string, private authProvider: AuthProvider) {
    super({ basePath, routePath });
    
    this.subPaths = [
      { path: authRouteMapping.auth.subPaths.authenticate.path, authenticate: false, handler: this.authenticate.bind(this) },
      { path: authRouteMapping.auth.subPaths.register.path, authenticate: true, handler: this.register.bind(this) }
    ];
  }

  private async authenticate(req: Request, res: Response, next: NextFunction) {
    const method = authRouteMapping.auth.subPaths.authenticate.name as T;
    await this.processRequest({ method }, req, res, next);
  }

  private async register(req: Request, res: Response, next: NextFunction) {
    const method = authRouteMapping.auth.subPaths.register.name as T;
    await this.processRequest({ method }, req, res, next);
  }

  async validateRequest(opts: RouteReqOpts<T>, req: Request): Promise<V> {
    try {
      if (opts.method === 'authenticate') {
        const potential: AuthRequest<'authenticate'> = req.body;

        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');
        if (RouteRequestValidators.isInvalidType('string', potential.email)) throw new Error('invalid args on request');
        if (RouteRequestValidators.isInvalidType('string', potential.password)) throw new Error('invalid args on request');
        
        return potential as V;
      }
  
      if (opts.method === 'register') {
        const potential: AuthRequest<'register'> = req.body;

        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');
        if (RouteRequestValidators.isInvalidType('string', potential.email)) throw new Error('invalid args on request');
        if (RouteRequestValidators.isInvalidType('string', potential.password)) throw new Error('invalid args on request');
        if (RouteRequestValidators.isInvalidType('string', potential.org)) throw new Error('invalid args on request');
  
        return potential as V;
      }

      throw new Error('invalid method supplied');
    } catch (err) { throw err; }
  }

  async executeRequest(opts: RouteReqOpts<T>, args: V, res: Response, _next: NextFunction) {
    try {
      const resp = await this.authProvider[opts.method](args as any);
      if (! resp) throw new Error('no resp body returned');
      
      res.status(200).send({ status: 'success', resp });
    } catch (err) {
      this.zLog.error(`Error on ${AuthRoute.name} => ${err as Error}`);
      res.status(404).send({ err: NodeUtil.extractErrorMessage(err as Error) });
    }
  }
}