import { BaseRoute } from '../../server/types/RouteMappings.js';


type SearchRoute = '';
type SearchRouteSubRoutes = 'process';

export const searchRouteMapping: Record<string, BaseRoute<SearchRoute, SearchRouteSubRoutes>>= {
  query: {
    name: '',
    routePath: '/',
    subPaths: {
      process: { name: 'process', path: '/process' }
    }
  }
}