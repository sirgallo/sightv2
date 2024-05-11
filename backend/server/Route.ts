import { Response, Router, Request, NextFunction } from 'express';
import { join } from 'path';

import { JWTMiddleware, JWTOpts } from '../core/middleware/JWTMiddleware.js';


/*
  Route:
    all routes need to extend this class.
*/
export abstract class Route<T extends string, V> {
  protected jwtMiddleware: JWTMiddleware;
  protected routeAuthEnabled: boolean = false;

  private __router: Router;
  private __rootpath: string;
  private __subPaths: RoutePathOpts[] = [];

  constructor(opts: RouteOpts) { 
    this.__router = Router(); 
    this.__rootpath = this.__mergeBaseRoutePath(opts);
    
    if (opts.jwtOpts) {
      this.jwtMiddleware = new JWTMiddleware(opts.jwtOpts);
      this.routeAuthEnabled = true;
    }
  }

  get router() { return this.__router; };
  get rootpath() { return this.__rootpath; }

  get subPaths() { return this.__subPaths; }
  set subPaths(subPaths: RoutePathOpts[]) { 
    this.__subPaths = subPaths;
    this.__register(subPaths); 
  }

  protected async processRequest(opts: RouteReqOpts<T>, req: Request, res: Response, next: NextFunction): Promise<boolean> {
    try {
      if (this.__subPaths.length === 0) throw new Error('no subpaths defined on route');
      
      const validatedArgs = await this.validateRequest(opts, req);
      if (! validatedArgs) throw new Error('invalid request arguments passed from client')
      await this.executeRequest(opts, validatedArgs, res, next);

      return true;
    } catch (err) {
      res.status(404).send({ err: 'exception while processing route request' });
      return false;
    }
  }

  abstract validateRequest(opts: RouteReqOpts<T>, req: Request): Promise<V>;
  abstract executeRequest(opts: RouteReqOpts<T>, args: Awaited<ReturnType<typeof this.validateRequest>>, res: Response, next: NextFunction): Promise<void>;

  private __register( subPaths: RoutePathOpts[]) {
    for (const { path, authenticate, handler } of subPaths) {
      if (authenticate && this.routeAuthEnabled) this.router.post(path, this.jwtMiddleware.authenticate, handler.bind(this));
      this.router.post(path, handler.bind(this));
    }
  }

  private __mergeBaseRoutePath = (opts: RouteOpts) => opts?.basePath ? join(opts.basePath, opts.routePath) : opts.routePath;
}


export class RouteRequestValidators {
  static isEmptyArray = <T>(arg?: T[]): boolean => {
    const isNull = RouteRequestValidators.isNullOrUndefined(arg);
    if (isNull) return true;

    return arg?.length === 0;
  };

  static isInvalidType = (type: ValidField, arg?: any): boolean => { 
    const isNull = RouteRequestValidators.isNullOrUndefined(arg);
    if (isNull) return true;

    return typeof arg !== type;
  };

  static isEmptObject = (arg?: any) => {
    const isNull = RouteRequestValidators.isNullOrUndefined(arg);
    if (isNull) return true;

    const invalidType = RouteRequestValidators.isInvalidType('object', arg);
    if (invalidType) return true;

    return Object.keys(arg).length === 0;
  }

  private static isNullOrUndefined = <T>(arg?: T): boolean => ! arg;
}


type ValidField = 
  'boolean'
  | 'number'
  | 'string'
  | 'object'

export interface RouteImpl {
  registerPaths(paths: RoutePathOpts[]): void;
}

export interface RouteReqOpts<T extends string> {
  method: T;
}

export interface RouteOpts {
  routePath: string;
  basePath?: string;
  jwtOpts?: JWTOpts;
}

export interface RoutePathOpts {
  path: string,
  authenticate: boolean;
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
}