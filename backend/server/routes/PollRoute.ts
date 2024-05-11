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
  constructor(routePath: string) {
    super({ routePath });
    this.router.get(routeMappings.poll.subPaths.root.name, this.poll.bind(this));
  }

  private poll(_req: Request, _res: Response, _next: NextFunction) {
    this.log.info('validated health check');
    _res.status(200).send({ alive: 'okay' });
  }

  validateRequest = async (_opts: RouteReqOpts<T>, _req: Request): Promise<V> => {
    const validated = true;
    return validated as V;
  };

  executeRequest = async (_opts: RouteReqOpts<T>, args: V, _res: Response, _next: NextFunction) => null;
}