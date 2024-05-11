/*
import { Request, Response, NextFunction } from 'express';

import { BaseRoute, RouteOpts } from '@core/server/Route';
import { LogProvider } from '@core/providers/LogProvider';
import { AuthenticateUserRequest, RegisterUserRequest, AuthRequests } from '@common/types/Auth';
import { extractErrorMessage } from '@core/utils/Utils';

import { taskRouteMapping } from '@gateway/configs/TaskRouteMapping';
import { TaskProvider } from '@gateway/providers/TaskProvider';


export class TaskRoute extends BaseRoute {
  private zLog: LogProvider = new LogProvider(TaskRoute.name);
  constructor(basepath: string, path: string, private taskProvider: TaskProvider) {
    super({ basepath, path });
    
    this.router.post(taskRouteMapping.task.subRouteMappings.deploy.name, this.deploy.bind(this));
    this.router.post(taskRouteMapping.task.subRouteMappings.paginate.name, this.paginate.bind(this));
    this.router.post(taskRouteMapping.task.subRouteMappings.details.name, this.details.bind(this));
    this.router.post(taskRouteMapping.task.subRouteMappings.destroy.name, this.destroy.bind(this));
    this.router.post(taskRouteMapping.task.subRouteMappings.restart.name, this.restart.bind(this));
    this.router.post(taskRouteMapping.task.subRouteMappings.kill.name, this.kill.bind(this));
    this.router.post(taskRouteMapping.task.subRouteMappings.configure.name, this.configure.bind(this));
    this.router.post(taskRouteMapping.task.subRouteMappings.resolve.name, this.resolve.bind(this));
    this.router.post(taskRouteMapping.task.subRouteMappings.bulkresolve.name, this.bulkresolve.bind(this));
    this.router.post(taskRouteMapping.task.subRouteMappings.test.name, this.test.bind(this));
  }

  private async deploy(req: Request, res: Response, next: NextFunction) {
    const runReq: AuthenticateUserRequest = req.body;
    await this.pipeRequest(
      { 
        method: taskRouteMapping.task.subRouteMappings.deploy.key, 
        customMsg: taskRouteMapping.task.subRouteMappings.deploy 
      }, 
      req, res, next, runReq
    );
  }

  private async paginate(req: Request, res: Response, next: NextFunction) {
    const runReq: AuthenticateUserRequest = req.body;
    await this.pipeRequest(
      { 
        method: taskRouteMapping.task.subRouteMappings.paginate.key, 
        customMsg: taskRouteMapping.task.subRouteMappings.paginate 
      }, 
      req, res, next, runReq
    );
  }

  private async details(req: Request, res: Response, next: NextFunction) {
    const runReq: AuthenticateUserRequest = req.body;
    await this.pipeRequest(
      { 
        method: taskRouteMapping.task.subRouteMappings.details.key, 
        customMsg: taskRouteMapping.task.subRouteMappings.details 
      }, 
      req, res, next, runReq
    );
  }

  private async destroy(req: Request, res: Response, next: NextFunction) {
    const runReq: AuthenticateUserRequest = req.body;
    await this.pipeRequest(
      { 
        method: taskRouteMapping.task.subRouteMappings.destroy.key, 
        customMsg: taskRouteMapping.task.subRouteMappings.destroy 
      }, 
      req, res, next, runReq
    );
  }

  private async restart(req: Request, res: Response, next: NextFunction) {
    const runReq: AuthenticateUserRequest = req.body;
    await this.pipeRequest(
      { 
        method: taskRouteMapping.task.subRouteMappings.restart.key, 
        customMsg: taskRouteMapping.task.subRouteMappings.restart 
      }, 
      req, res, next, runReq
    );
  }

  private async kill(req: Request, res: Response, next: NextFunction) {
    const runReq: AuthenticateUserRequest = req.body;
    await this.pipeRequest(
      { 
        method: taskRouteMapping.task.subRouteMappings.kill.key, 
        customMsg: taskRouteMapping.task.subRouteMappings.kill 
      }, 
      req, res, next, runReq
    );
  }

  private async configure(req: Request, res: Response, next: NextFunction) {
    const runReq: AuthenticateUserRequest = req.body;
    await this.pipeRequest(
      { 
        method: taskRouteMapping.task.subRouteMappings.configure.key, 
        customMsg: taskRouteMapping.task.subRouteMappings.configure 
      }, 
      req, res, next, runReq
    );
  }

  private async resolve(req: Request, res: Response, next: NextFunction) {
    const runReq: AuthenticateUserRequest = req.body;
    await this.pipeRequest(
      { 
        method: taskRouteMapping.task.subRouteMappings.resolve.key, 
        customMsg: taskRouteMapping.task.subRouteMappings.resolve 
      }, 
      req, res, next, runReq
    );
  }

  private async bulkresolve(req: Request, res: Response, next: NextFunction) {
    const runReq: AuthenticateUserRequest = req.body;
    await this.pipeRequest(
      { 
        method: taskRouteMapping.task.subRouteMappings.bulkresolve.key, 
        customMsg: taskRouteMapping.task.subRouteMappings.bulkresolve 
      }, 
      req, res, next, runReq
    );
  }

  private async test(req: Request, res: Response, next: NextFunction) {
    const runReq: AuthenticateUserRequest = req.body;
    await this.pipeRequest(
      { 
        method: taskRouteMapping.task.subRouteMappings.test.key, 
        customMsg: taskRouteMapping.task.subRouteMappings.test 
      }, 
      req, res, next, runReq
    );
  }
  

  async validateRoute(req: Request, res: Response, next: NextFunction): Promise<boolean> {
    return true;
  }

  async performRouteAction(opts: RouteOpts, req: Request, res: Response, next: NextFunction, params: AuthRequests) {
    try {
      const resp = await this.taskProvider[opts.method](params);
      this.zLog.custom(opts.customMsg.customConsoleMessages[0], true);
      res.status(200).send({ status: 'success', resp });
    } catch (err) {
      this.zLog.error(`Error on ${TaskRoute.name} => ${err as Error}`);
      res.status(404).send({ err: extractErrorMessage(err as Error) });
    }
  }
}
*/