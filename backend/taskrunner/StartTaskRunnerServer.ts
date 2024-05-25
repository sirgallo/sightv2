import { serverConfigurations } from '../ServerConfigurations.js';
import { TaskRunnerServer } from './TaskRunnerServer.js';


try {
  const server = new TaskRunnerServer(serverConfigurations.search);
  await server.startServer()
} catch (err) { console.log(err); }