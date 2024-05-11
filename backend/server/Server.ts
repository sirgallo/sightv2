import express from 'express';
import { Application, Request, Response, NextFunction, json, static as eStatic, urlencoded } from 'express';
import cluster from 'cluster';
import { config } from 'dotenv';
import { cpus, networkInterfaces } from 'os';
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
  protected _name: string;

  protected app: Application;
  protected root: `/${string}`;
  protected _ip: string;
  protected port: number;
  protected version: string;
  protected staticFilesDir: string = 'public';

  protected numOfCpus: number = cpus().length;
  protected _routes: Route<string, unknown>[] = [ new PollRoute(routeMappings.poll.name) ];
  protected zLog: LogProvider;

  constructor(opts: ServerConfiguration<T>) {
    this._name = opts.name;
    this.zLog = new LogProvider(this._name);

    this.port = opts.port;
    this.version = opts.version;
    this.numOfCpus = opts.numOfCpus;
    this.root = opts.root;
    if (opts?.staticFilesDir) this.staticFilesDir = opts.staticFilesDir;
  }

  get name() { return this._name; }
  get ip() { return this._ip; }
  get routes() { return this._routes; }
  set routes(routes: Route<string, unknown>[]) { this._routes = this.routes.concat(routes); }

  async startServer() {
    try {
      await this.initService();
      this.run();
      this.startEventListeners();
    } catch(err) {
      this.zLog.error(`error message: ${err.message}`);
      throw err;
    }
  }

  abstract initService(): Promise<boolean>;
  abstract startEventListeners(): Promise<void>;

  private async run() {
    try { 
      this.zLog.info(`welcome to ${this.name}, version ${this.version}`);
      if (this.numOfCpus > 1) {
        if (cluster.isPrimary) {
          this.zLog.info('...forking workers');

          this.initApp();
          this.setUpWorkers();
        } else if (cluster.isWorker) {
          this.initApp();
          this.initMiddleware();
          this.initRoutes();
          this.setUpServer();
        }
      } else if (this.numOfCpus === 1) {
        this.initApp();
        this.initMiddleware();
        this.initRoutes();
        this.setUpServer();
      } else {
        throw new Error('number of cpus must be greater than 1.');
      }
    } catch (err) {
      this.zLog.error(NodeUtil.extractErrorMessage(err as Error));
      process.exit(1);
    }
  }

  private initApp() {
    try {
      this.app = express();
    } catch (err) { throw Error(`error initializing app => ${NodeUtil.extractErrorMessage(err as Error)}`); }
  }

  private initMiddleware() {
    try {
      this.initIpAddress();
      this.app.set('port', this.port);

      this.app.use(json());
      this.app.use(urlencoded({ extended: false }));
      this.app.use(cookieParser());
      this.app.use(eStatic(this.staticFilesDir));
      this.app.use(compression());
      this.app.use(helmet());
    } catch (err) { throw Error(`error initializing middleware => ${NodeUtil.extractErrorMessage(err as Error)}`); }
  }

  private initRoutes() {
    try {
      for (const route of this.routes) {
        this.app.use(route.rootpath, route.router);
        this.zLog.info(`Route: ${route.rootpath} initialized on Worker ${process.pid}.`);
      }

      this.app.use((_req: Request, _res: Response, next: NextFunction) => next(createError(404)));
      this.app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => res.status(err.status ?? 500).json({ error: err.message }));
    } catch (err) { throw Error(`error initializing routes => ${NodeUtil.extractErrorMessage(err as Error)}`); }
  }

  private setUpServer() {
    this.app.listen(this.port, () => this.zLog.info(`server ${process.pid} @${this._ip} listening on port ${this.port}...`));
  }

  private setUpWorkers() {
    const fork = () => {
      const f = cluster.fork();
      f.on('message', message => this.zLog.debug(message));
    }

    this.zLog.info(`server @${this._ip} setting up ${this.numOfCpus} cpus as workers.\n`);
    for (let cpu = 0; cpu < this.numOfCpus; cpu++) { fork(); }

    cluster.on('online', worker => this.zLog.info(`Worker ${worker.process.pid} is online.`));
    cluster.on('exit', (worker, code, signal) => {
      this.zLog.error(`worker ${worker.process.pid} died with code ${code} and ${signal}.`);
      this.zLog.warn('starting new worker...');
      fork();
    });
  }

  private initIpAddress() {
    try {
      this._ip = Object
        .keys(networkInterfaces())
        .map(key => { if (/(eth[0-9]{1}|enp[0-9]{1}s[0-9]{1})/.test(key)) return networkInterfaces()[key][0].address; })
        .filter(el => el)[0];
    } catch (err) {
      this.zLog.error(`unable to select network interface: ${err}`);
      process.exit(1);
    }
  }
}