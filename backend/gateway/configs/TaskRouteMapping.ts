import { BaseRoute } from '../../server/types/RouteMappings';


type TaskRoute = 'task';
type TaskRouteSubRoutes = 
  'deploy'
  | 'paginate' 
  | 'details'
  | 'destroy' 
  | 'restart' 
  | 'kill'
  | 'configure'
  | 'resolve'
  | 'bulkresolve'
  | 'test';

export const taskRouteMapping: Record<TaskRoute, BaseRoute<TaskRoute, TaskRouteSubRoutes>>= {
  task: {
    name: 'task',
    routePath: '/task',
    subPaths: {
      deploy: { name: 'deploy', path: '/deploy' },
      paginate: { name: 'paginate', path: '/paginate' },
      details: { name: 'details', path: '/details' },
      destroy: { name: 'destroy', path: '/destroy' },
      restart: { name: 'restart', path: '/restart' },
      kill: { name: 'kill', path: '/kill' },
      configure: { name: 'configure', path: '/configure' },
      resolve: { name: 'resolve', path: '/resolve' },
      bulkresolve: { name: 'bulkresolve', path: '/bulkresolve' },
      test: { name: 'test', path: '/test' }
    }
  }
}