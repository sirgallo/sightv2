import { BaseRoute } from '../../server/types/RouteMappings.js';
import { ModelEndpoints } from '../types/Model.js';


type ModelRoute = 'model';
export const modelRouteMapping: Record<ModelRoute, BaseRoute<ModelRoute, keyof ModelEndpoints>>= {
  model: {
    name: 'model',
    routePath: '/model',
    subPaths: {
      generate: { name: 'generate', path: '/generate' },
      view: { name: 'view', path: '/view' },
      update: { name: 'update', path: '/update' },
      delete: { name: 'delete', path: '/delete' }
    }
  }
}