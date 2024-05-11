export type Route<T extends string, V extends string> = { 
  [route in T]: BaseRoute<route, V> 
};

export interface BaseRoute<T extends string, V extends string> {
  name: T;
  routePath: `/${T}` | '/';
  subPaths?: subRouteMappings<V>;
}

interface SubRouteMap<T extends string> {
  name: T;
  path: `/${T}` | '/';
}

type subRouteMappings<T extends string> = { 
  [subRouteMapping in T]: SubRouteMap<subRouteMapping>
};