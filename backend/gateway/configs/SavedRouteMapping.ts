import { BaseRoute } from '../../server/types/RouteMappings.js';
import { SearchEndpoints } from '../types/Search.js';


type SearchRoute = 'search';
export const savedRouteMapping: Record<SearchRoute, BaseRoute<SearchRoute, keyof SearchEndpoints>>= {
  search: {
    name: 'search',
    routePath: '/search',
    subPaths: {
      create: { name: 'create', path: '/create' },
      update: { name: 'update', path: '/update' },
      delete: { name: 'delete', path: '/delete' }
    }
  }
}