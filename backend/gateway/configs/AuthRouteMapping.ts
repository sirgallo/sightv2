import { BaseRoute } from '../../server/types/RouteMappings.js';
import { AuthEndpoints } from '../types/Auth.js';


type AuthRoute = 'auth';
export const authRouteMapping: Record<AuthRoute, BaseRoute<AuthRoute, keyof AuthEndpoints>>= {
  auth: {
    name: 'auth',
    routePath: '/auth',
    subPaths: {
      authenticate: { name: 'authenticate', path: '/authenticate' },
      register: { name: 'register', path: '/register' }
    }
  }
}