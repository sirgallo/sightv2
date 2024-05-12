import { Request, Response, NextFunction } from 'express';

import { Route, RouteReqOpts, RouteRequestValidators } from '../../server/Route.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { ModelProvider } from '../providers/ModelProvider.js';
import { modelRouteMapping } from '../configs/ModelRouteMapping.js';
import { ModelEndpoints, ModelRequest } from '../types/Model.js';


export class ModelRoute<T extends keyof ModelEndpoints, V extends ModelRequest<T>> extends Route<T, V> {
  private zLog: LogProvider = new LogProvider(ModelRoute.name);
  constructor(basePath: string, routePath: string, private modelProvider: ModelProvider) {
    super({ basePath, routePath });
    
    this.subPaths = [
      { path: modelRouteMapping.model.subPaths.generate.path, authenticate: true, handler: this.generate },
      { path: modelRouteMapping.model.subPaths.view.path, authenticate: true, handler: this.view },
      { path: modelRouteMapping.model.subPaths.update.path, authenticate: true, handler: this.update },
      { path: modelRouteMapping.model.subPaths.delete.path, authenticate: true, handler: this.delete }
    ];
  }

  private async generate(req: Request, res: Response, next: NextFunction) {
    const method = modelRouteMapping.model.subPaths.generate.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  private async view(req: Request, res: Response, next: NextFunction) {
    const method = modelRouteMapping.model.subPaths.view.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  private async update(req: Request, res: Response, next: NextFunction) {
    const method = modelRouteMapping.model.subPaths.update.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  private async delete(req: Request, res: Response, next: NextFunction) {
    const method = modelRouteMapping.model.subPaths.update.name as T;
    return this.processRequest({ method }, req, res, next);
  }

  async validateRequest(opts: RouteReqOpts<T>, req: Request): Promise<V> {
    try {
      if (opts.method === 'generate') {
        const potential: ModelRequest<'generate'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');

        return potential as V;
      }
  
      if (opts.method === 'view') {
        const potential: ModelRequest<'view'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');

        return potential as V;
      }
  
      if (opts.method === 'update') {
        const potential: ModelRequest<'update'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');

        return potential as V;
      }
  
      if (opts.method === 'delete') {
        const potential: ModelRequest<'delete'> = req.body;
        if (RouteRequestValidators.isEmptObject(potential)) throw new Error('empty request');

        return potential as V;
      }

      throw new Error('invalid method supplied');
    } catch (err) { throw err; }
  }

  async executeRequest(opts: RouteReqOpts<T>, args: V, res: Response, _next: NextFunction) {
    try {
      const resp = await this.modelProvider[opts.method](args as any);
      if (! resp) throw new Error('no resp body returned');

      res.status(200).send({ status: 'success', resp });
      return true;
    } catch (err) {
      this.zLog.error(`Error on ${ModelRoute.name} => ${err as Error}`);
      res.status(404).send({ err: NodeUtil.extractErrorMessage(err as Error) });
      return true;
    }
  }
}