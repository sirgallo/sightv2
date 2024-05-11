import { BaseRoute } from '../../server/types/RouteMappings.js';
import { SavedEndpoints } from '../types/Saved.js';


type SavedRoute = 'saved';
export const savedRouteMapping: Record<SavedRoute, BaseRoute<SavedRoute, keyof SavedEndpoints>>= {
  saved: {
    name: 'saved',
    routePath: '/saved',
    subPaths: {
      create: { name: 'create', path: '/create' },
      update: { name: 'update', path: '/update' },
      delete: { name: 'delete', path: '/delete' }
    }
  }
}