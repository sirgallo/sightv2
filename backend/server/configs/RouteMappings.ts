import { BaseRoute } from '../types/RouteMappings.js';


type GlobalPollRoute = 'poll';
type GlobalPollRouteSubRoutes = 'root';

/*
  routeMappings:
    single source of truth for all routes, with all subRoutes and custom logs defined here.
    can have multiple routeMappings per project.
    base project will always have a poll route for health checks.
*/
export const routeMappings: { [route in GlobalPollRoute]: BaseRoute<route, GlobalPollRouteSubRoutes> } = {
  poll: {
    name: 'poll',
    routePath: '/poll',
    subPaths: {
      root: { name: 'root', path: '/' }
    }
  }
}