import { Request, Response, NextFunction } from 'express';

import { LogProvider } from '../../core/log/LogProvider.js';
import { Route, RouteReqOpts } from '../Route.js';
import { routeMappings } from '../configs/RouteMappings.js';


/*
  PollRoute:
    1.) health check endpoint
    2.) return response if alive
*/
export class PollRoute<T extends 'poll', V extends boolean> extends Route<T, V> {
  private __zLog: LogProvider = new LogProvider(PollRoute.name);
  constructor(basePath: string, routePath: string) {
    super({ basePath, routePath });
    this.router.get(routeMappings.poll.subPaths.root.path, this.poll.bind(this));
  }

  private poll(__req: Request, res: Response, __next: NextFunction) {
    res.status(200).send({ alive: 'okay' });
  }

  validateRequest = async (__opts: RouteReqOpts<T>, __req: Request): Promise<V> => { return true as V; }
  executeRequest = async (__opts: RouteReqOpts<T>, __args: V, __res: Response, __next: NextFunction) => { return true; }
}