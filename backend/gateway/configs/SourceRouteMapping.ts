import { BaseRoute } from '../../server/types/RouteMappings.js';
import { SourceEndpoints } from '../types/Source.js';


type SourceRoute = 'source';
export const sourceRouteMapping: Record<SourceRoute, BaseRoute<SourceRoute, keyof SourceEndpoints>>= {
  source: {
    name: 'source',
    routePath: '/source',
    subPaths: {
      create: { name: 'create', path: '/create' },
      update: { name: 'update', path: '/update' },
      delete: { name: 'delete', path: '/delete' },
      test: { name: 'test', path: '/test' }
    }
  }
}