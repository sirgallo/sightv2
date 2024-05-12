import { Request, Response, NextFunction } from 'express';

import { Route, RouteReqOpts, RouteRequestValidators } from '../../server/Route.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { SourceProvider } from '../providers/SourceProvider.js';
import { SourceEndpoints, SourceRequest} from '../types/Source.js';
import { sourceRouteMapping } from '../configs/SourceRouteMapping.js';


export class SourceRoute<T extends keyof SourceEndpoints, V extends SourceRequest<T>> extends Route<T, V> {
  private zLog: LogProvider = new LogProvider(SourceRoute.name);
  constructor(basePath: string, routePath: string, private sourceProvider: SourceProvider) {
    super({ basePath, routePath });

    this.subPaths = [
      { path: sourceRouteMapping.source.subPaths.create.path, authenticate: true, handler: this.create },
      { path: sourceRouteMapping.source.subPaths.update.path, authenticate: true, handler: this.update },
      { path: sourceRouteMapping.source.subPaths.delete.path, authenticate: true, handler: this.delete },
      { path: sourceRouteMapping.source.subPaths.test.path, authenticate: true, handler: this.test },
    ];
  }

  private async create(req: Request, res: Response, next: NextFunction) {
    const method = sourceRouteMapping.source.subPaths.create.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  private async update(req: Request, res: Response, next: NextFunction) {
    const method = sourceRouteMapping.source.subPaths.update.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  private async delete(req: Request, res: Response, next: NextFunction) {
    const method = sourceRouteMapping.source.subPaths.delete.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  private async test(req: Request, res: Response, next: NextFunction) {
    const method = sourceRouteMapping.source.subPaths.test.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  async validateRequest(opts: RouteReqOpts<T>, req: Request): Promise<V> {
    try {
      if (opts.method === 'create') {
        const potential: SourceRequest<'create'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');
  
        return potential as V;
      }
  
      if (opts.method === 'update') {
        const potential: SourceRequest<'update'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');
  
        return potential as V;
      }
  
      if (opts.method === 'delete') {
        const potential: SourceRequest<'delete'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');
  
        return potential as V;
      }

      throw new Error('invalid method supplied');
    } catch (err) { throw err; }
  }

  async executeRequest(opts: RouteReqOpts<T>, args: V, res: Response, _next: NextFunction) {
    try {
      const resp = await this.sourceProvider[opts.method](args as any);
      if (! resp) throw new Error('no resp body returned');

      res.status(200).send({ status: 'success', resp });
      return true;
    } catch (err) {
      this.zLog.error(`Error on ${SourceRoute.name} => ${err as Error}`);
      res.status(404).send({ err: NodeUtil.extractErrorMessage(err as Error) });
      return false;
    }
  }
}