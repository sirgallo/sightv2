import express from 'express';
import { createServer, Server as HttpServer } from 'http';
import { Application, Request, Response, NextFunction, json, static as eStatic, urlencoded } from 'express';
import cluster from 'cluster';
import { config } from 'dotenv';
import { cpus, hostname } from 'os';
import createError, { HttpError } from 'http-errors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';

import { LogProvider } from '../core/log/LogProvider.js';
import { NodeUtil } from '../core/utils/Node.js';
import { Route } from './Route.js';
import { PollRoute } from './routes/PollRoute.js';
import { ServerConfiguration } from './types/ServerConfiguration.js';
import { routeMappings } from './configs/RouteMappings.js';


/*
  Server:
    initialize express app
    if primary, fork workers
    if worker:
      1.) initialize routes
      2.) start service
      3.) listen on default port
*/
config({ path: '.env' });
export abstract class Server<T extends string> {
  protected app: Application;
  protected server: HttpServer;
  protected root: `/${string}`;
  protected port: number;
  protected version: string;
  protected staticFilesDir: string = 'public';
  protected numOfCpus: number = cpus().length;
  protected zLog: LogProvider;

  private __hostname = hostname();
  private __name: string;
  private __routes: Route<string, unknown>[];

  constructor(opts: ServerConfiguration<T>) {
    this.__name = opts.name;
    this.zLog = new LogProvider(this.__name);

    this.port = opts.port;
    this.version = opts.version;
    this.numOfCpus = opts.numOfCpus;
    this.root = opts.root;

    this.__routes = [ new PollRoute(opts.root, routeMappings.poll.name) ];
    if (opts?.staticFilesDir) this.staticFilesDir = opts.staticFilesDir;
  }

  get hostname() { return this.__hostname; }
  get name() { return this.__name; }
  get routes() { return this.__routes; }
  set routes(routes: Route<string, unknown>[]) { this.__routes = this.routes.concat(routes); }

  abstract initService(): Promise<boolean>;
  abstract startEventListeners(): Promise<void>;

  async startServer() {
    try { 
      this.zLog.info(`welcome to ${this.name}, version ${this.version}`);
      await this.initService();
      this.__initApp();
      await this.startEventListeners();
    } catch (err) {
      this.server.removeAllListeners();
      this.zLog.error(NodeUtil.extractErrorMessage(err));
      process.exit(1);
    }
  }

  private __initApp() {
    try {
      this.app = express();
      this.__initMiddleware();
      this.__initRoutes();
      this.server = createServer(this.app);
      
      if (this.numOfCpus > 1 && cluster.isPrimary) {
        this.zLog.info('...forking workers');
        this.__setUpWorkers();
      } else if (this.numOfCpus === 1 || (this.numOfCpus > 1 && cluster.isWorker)) {
        this.__listen();
      } else {
        throw new Error('number of cpus must be greater than 1.');
      }
    } catch (err) { 
      throw Error(`error initializing app => ${NodeUtil.extractErrorMessage(err as Error)}`); 
    }
  }

  private __initMiddleware() {
    try {
      this.app.use(json());
      this.app.use(urlencoded({ extended: false }));
      this.app.use(cookieParser());
      this.app.use(eStatic(this.staticFilesDir));
      this.app.use(compression());
      this.app.use(helmet());
    } catch (err) { throw Error(`error initializing middleware => ${NodeUtil.extractErrorMessage(err as Error)}`); }
  }

  private __initRoutes() {
    try {
      for (const route of this.__routes) {
        this.app.use(route.rootpath, route.router);
        this.zLog.info(`Route: ${route.rootpath} initialized on Worker ${process.pid}.`);
      }

      this.app.use((__req: Request, __res: Response, next: NextFunction) => next(createError(404)));
      this.app.use((err: HttpError, __req: Request, res: Response, __next: NextFunction) => res.status(err.status ?? 500).json({ error: err.message }));
    } catch (err) { throw Error(`error initializing routes => ${NodeUtil.extractErrorMessage(err as Error)}`); }
  }

  private __listen() {
    this.server.listen(this.port, this.__hostname, () => this.zLog.info(`${this.__hostname} on process ${process.pid} listening on port ${this.port}...`));
  }

  private __setUpWorkers() {
    const fork = () => {
      const f = cluster.fork();
      f.on('message', message => this.zLog.debug(message));
    }

    this.zLog.info(`setting up ${this.numOfCpus} cpus as workers.\n`);
    for (let cpu = 0; cpu < this.numOfCpus; cpu++) { fork(); }

    cluster.on('online', worker => this.zLog.info(`Worker ${worker.process.pid} is online.`));
    cluster.on('exit', (worker, code, signal) => {
      this.zLog.error(`worker ${worker.process.pid} died with code ${code} and ${signal}.`);
      this.zLog.warn('starting new worker...');
      fork();
    });
  }
}