import { Request, Response, NextFunction } from 'express';

import { Route, RouteReqOpts, RouteRequestValidators } from '../../server/Route.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { accountRouteMapping } from '../configs/AccountRouteMapping.js';
import { AccountProvider } from '../providers/AccountProvider.js';
import { AccountEndpoints, AccountRequest } from '../types/Account.js';


export class AccountRoute<T extends keyof AccountEndpoints, V extends AccountRequest<T>> extends Route<T, V>  {
  private zLog: LogProvider = new LogProvider(AccountRoute.name);
  constructor(basePath: string, routePath: string, private accountProvider: AccountProvider) {
    super({ basePath, routePath  });

    this.subPaths = [
      { path: accountRouteMapping.account.subPaths.details.path, authenticate: true, handler: this.details.bind(this) },
      { path: accountRouteMapping.account.subPaths.update.path, authenticate: true, handler: this.update.bind(this) },
      { path: accountRouteMapping.account.subPaths.delete.path, authenticate: true, handler: this.delete.bind(this) },
    ];
  }

  private async details(req: Request, res: Response, next: NextFunction) {
    const method = accountRouteMapping.account.subPaths.details.name as T
    await this.processRequest({ method }, req, res, next);
  }

  private async update(req: Request, res: Response, next: NextFunction) {
    const method = accountRouteMapping.account.subPaths.update.name as T
    await this.processRequest({ method }, req, res, next);
  }

  private async delete(req: Request, res: Response, next: NextFunction) {
    const method = accountRouteMapping.account.subPaths.delete.name as T
    await this.processRequest({ method }, req, res, next);
  }

  async validateRequest(opts: RouteReqOpts<T>, req: Request): Promise<V> {
    try {
      if (opts.method === 'details') {
        const potential: AccountRequest<'details'> = req.body;
        
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');
        if ('email' in potential && RouteRequestValidators.isInvalidType('string', potential.email)) throw new Error('invalid args on request');
        if ('userId' in potential && RouteRequestValidators.isInvalidType('string', potential.userId)) throw new Error('invalid args on request');
        
        return potential as V;
      }

      if (opts.method === 'update') {
        const potential: AccountRequest<'update'> = req.body;
        
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');
        if (RouteRequestValidators.isInvalidType('string', potential.filter.userId)) throw new Error('invalid args on request');
        if (RouteRequestValidators.isEmptObject(potential.update)) throw new Error('invalid args on request');
        
        return potential as V;
      }

      if (opts.method === 'delete') {
        const potential: AccountRequest<'delete'> = req.body;
        
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');
        if (RouteRequestValidators.isInvalidType('string', potential.userId)) throw new Error('invalid args on request');
        
        return potential as V;
      }

      throw new Error('invalid method supplied');
    } catch (err) { throw err; }
  }

  async executeRequest(opts: RouteReqOpts<T>, args: V, res: Response, _next: NextFunction) {
    try {
      const resp = await this.accountProvider[opts.method](args as any);
      res.status(200).send({ status: 'success', resp });
    } catch (err) {
      this.zLog.error(`Error on ${AccountRoute.name} => ${err as Error}`);
      res.status(404).send({ err: NodeUtil.extractErrorMessage(err as Error) });
    }
  }
}