import { Request, Response, NextFunction } from 'express';

import { LogProvider } from '../../core/log/LogProvider.js';
import { Route, RouteReqOpts } from '../../server/Route.js';
import { broadcastRouteMappings } from '../configs/BroadcastRouteMapping.js';


/*
  PollRoute:
    1.) health check endpoint.
    2.) return response if alive
*/
export class BroadcastRoute<T extends 'poll', V extends boolean> extends Route<T, V> {
  private __zLog: LogProvider = new LogProvider(BroadcastRoute.name);
  constructor(basePath: string, routePath: string) {
    super({ basePath, routePath });
    this.router.get(broadcastRouteMappings['socket.io'].subPaths.root.path, this.broadcast.bind(this));
  }

  private broadcast(__req: Request, res: Response, __next: NextFunction) {
    res.status(200).send('broadcast endpoint');
  }

  validateRequest = async (__opts: RouteReqOpts<T>, __req: Request): Promise<V> => { return true as V; }
  executeRequest = async (__opts: RouteReqOpts<T>, __args: V, __res: Response, __next: NextFunction) => { return true; }
}