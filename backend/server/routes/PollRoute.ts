import { Request, Response, NextFunction } from 'express';

import { LogProvider } from '../../core/log/LogProvider.js';
import { Route, RouteReqOpts } from '../Route.js';
import { routeMappings } from '../configs/RouteMappings.js';


/*
  PollRoute:
    1.) health check endpoint.
    2.) return response if alive
*/
export class PollRoute<T extends 'poll', V extends boolean> extends Route<T, V> {
  private log: LogProvider = new LogProvider(PollRoute.name);
  constructor(basePath: string, routePath: string) {
    super({ basePath, routePath });
    this.router.get(routeMappings.poll.subPaths.root.path, this.poll.bind(this));
  }

  private poll(req: Request, res: Response, next: NextFunction) {
    this.log.info('health check reached');
    res.status(200).send({ alive: 'okay' });
  }

  validateRequest = async (_opts: RouteReqOpts<T>, _req: Request): Promise<V> => { return true as V; }
  executeRequest = async (_opts: RouteReqOpts<T>, _args: V, res: Response, _next: NextFunction) => { return true; }
}