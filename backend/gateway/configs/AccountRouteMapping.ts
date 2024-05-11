import { BaseRoute } from '../../server/types/RouteMappings.js';
import { AccountEndpoints } from '../types/Account.js';


type AccountRoute = 'account';
export const accountRouteMapping: Record<AccountRoute, BaseRoute<AccountRoute, keyof AccountEndpoints>>= {
  account: {
    name: 'account',
    routePath: '/account',
    subPaths: {
      details: { name: 'details', path: '/details' },
      update: { name: 'update', path: '/update' },
      delete: { name: 'delete', path: '/delete' }
    }
  }
}