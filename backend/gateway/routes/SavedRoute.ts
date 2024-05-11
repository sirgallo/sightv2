import { Request, Response, NextFunction } from 'express';

import { Route, RouteReqOpts, RouteRequestValidators } from '../../server/Route.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { SavedProvider } from '../providers/SavedProvider.js';
import { SavedEndpoints, SavedRequest } from '../types/Saved.js';
import { savedRouteMapping } from '../configs/SavedRouteMapping.js';


export class SavedRoute<T extends keyof SavedEndpoints, V extends SavedRequest<T>> extends Route<T, V> {
  private zLog: LogProvider = new LogProvider(SavedRoute.name);
  constructor(basePath: string, routePath: string, private savedProvider: SavedProvider) {
    super({ basePath, routePath });
    
    this.subPaths = [
      { path: savedRouteMapping.saved.subPaths.create.path, authenticate: true, handler: this.create.bind(this) },
      { path: savedRouteMapping.saved.subPaths.update.path, authenticate: true, handler: this.update.bind(this) },
      { path: savedRouteMapping.saved.subPaths.delete.path, authenticate: true, handler: this.delete.bind(this) },
    ];
  }

  private async create(req: Request, res: Response, next: NextFunction) {
    const method = savedRouteMapping.saved.subPaths.create.name as T;
    await this.processRequest({ method }, req, res, next);
  }

  private async update(req: Request, res: Response, next: NextFunction) {
    const method = savedRouteMapping.saved.subPaths.update.name as T;
    await this.processRequest({ method }, req, res, next);
  }

  private async delete(req: Request, res: Response, next: NextFunction) {
    const method = savedRouteMapping.saved.subPaths.delete.name as T;
    await this.processRequest({ method }, req, res, next);
  }

  async validateRequest(opts: RouteReqOpts<T>, req: Request): Promise<V> {
    try {
      if (opts.method === 'create') {
        const potential: SavedRequest<'create'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');

        return potential as V;
      }
  
      if (opts.method === 'update') {
        const potential: SavedRequest<'update'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');

        return potential as V;
      }
  
      if (opts.method === 'delete') {
        const potential: SavedRequest<'delete'> = req.body;
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
      const resp = await this.savedProvider[opts.method](args as any);
      res.status(200).send({ status: 'success', resp });
    } catch (err) {
      this.zLog.error(`Error on ${SavedRoute.name} => ${err as Error}`);
      res.status(404).send({ err: NodeUtil.extractErrorMessage(err as Error) });
    }
  }
}