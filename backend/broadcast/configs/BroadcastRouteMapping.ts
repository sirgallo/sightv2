import { BaseRoute } from '../../server/types/RouteMappings.js';


type BroadcastRoute = 'socket.io';
type BroadcastSubRoute = 'root';


export const broadcastRouteMappings: { [route in BroadcastRoute]: BaseRoute<route, BroadcastSubRoute> } = {
  ['socket.io']: {
    name: 'socket.io',
    routePath: '/socket.io',
    subPaths: {
      root: { name: 'root', path: '/' }
    }
  }
}