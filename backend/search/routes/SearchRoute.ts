import { Request, Response, NextFunction } from 'express';

import { Route, RouteReqOpts, RouteRequestValidators } from '../../server/Route.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { SearchProvider } from '../providers/SearchProvider';
import { SearchEndpoints, SearchRequest } from '../types/Search.js';
import { searchRouteMapping } from '../configs/SearchRouteMapping';


export class SearchRoute<T extends keyof SearchEndpoints, V extends SearchRequest<T>> extends Route<T, V> {
  private zLog: LogProvider = new LogProvider(SearchRoute.name);
  constructor(basePath: string, routePath: string, private searchProvider: SearchProvider) {
    super({ basePath, routePath });

    this.subPaths = [
      { path: searchRouteMapping.query.subPaths.process.path, authenticate: true, handler: this.process.bind(this) }
    ]

    this.router.post(searchRouteMapping.query.subPaths.process.path, this.process.bind(this));
  }

  private async process(req: Request, res: Response, next: NextFunction) {
    const method = searchRouteMapping.query.subPaths.process.name as T;
    await this.processRequest({ method }, req, res, next);
  }

  async validateRequest(opts: RouteReqOpts<T>, req: Request): Promise<V> {
    try {
      if (opts.method === 'process') {
        const potential: SearchRequest<'process'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');

        return potential as V;
      }

      throw new Error('invalid method supplied');
    } catch (err) { throw err; }
  }

  async executeRequest(opts: RouteReqOpts<T>, args: V, res: Response, next: NextFunction) {
    try {
      const resp = await this.searchProvider[opts.method](args as any);
      res.status(200).send({ status: 'success', resp });
    } catch (err) {
      this.zLog.error(`Error on ${SearchRoute.name} => ${err as Error}`);
      res.status(404).send({ err: NodeUtil.extractErrorMessage(err as Error) });
    }
  }
}