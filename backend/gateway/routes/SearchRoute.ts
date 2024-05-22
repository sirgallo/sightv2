import { Request, Response, NextFunction } from 'express';

import { Route, RouteReqOpts, RouteRequestValidators } from '../../server/Route.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { SearchProvider } from '../providers/SearchProvider.js';
import { SearchEndpoints, SearchRequest } from '../types/Search.js';
import { savedRouteMapping } from '../configs/SavedRouteMapping.js';


export class SearchRoute<T extends keyof SearchEndpoints, V extends SearchRequest<T>> extends Route<T, V> {
  private zLog: LogProvider = new LogProvider(SearchRoute.name);
  constructor(basePath: string, routePath: string, private searchProvider: SearchProvider) {
    super({ basePath, routePath });
    
    this.subPaths = [
      { path: savedRouteMapping.search.subPaths.create.path, authenticate: true, handler: this.create },
      { path: savedRouteMapping.search.subPaths.update.path, authenticate: true, handler: this.update },
      { path: savedRouteMapping.search.subPaths.delete.path, authenticate: true, handler: this.delete },
    ];
  }

  private async create(req: Request, res: Response, next: NextFunction) {
    const method = savedRouteMapping.search.subPaths.create.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  private async update(req: Request, res: Response, next: NextFunction) {
    const method = savedRouteMapping.search.subPaths.update.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  private async delete(req: Request, res: Response, next: NextFunction) {
    const method = savedRouteMapping.search.subPaths.delete.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  async validateRequest(opts: RouteReqOpts<T>, req: Request): Promise<V> {
    try {
      if (opts.method === 'create') {
        const potential: SearchRequest<'create'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');

        return potential as V;
      }
  
      if (opts.method === 'update') {
        const potential: SearchRequest<'update'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');

        return potential as V;
      }
  
      if (opts.method === 'delete') {
        const potential: SearchRequest<'delete'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');

        return potential as V;
      }

      throw new Error('invalid method supplied');
    } catch (err) { 
      throw err; 
    }
  }

  async executeRequest(opts: RouteReqOpts<T>, args: V, res: Response, _next: NextFunction) {
    try {
      const resp = await this.searchProvider[opts.method](args as any);
      if (! resp) throw new Error('no resp body returned');

      res.status(200).send({ status: 'success', resp });
      return true;
    } catch (err) {
      this.zLog.error(`Error on ${SearchRoute.name} => ${err as Error}`);
      res.status(404).send({ err: NodeUtil.extractErrorMessage(err as Error) });
      return false;
    }
  }
}