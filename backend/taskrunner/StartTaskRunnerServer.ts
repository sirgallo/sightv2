import { serverConfigurations } from '../ServerConfigurations.js';
import { TaskRunnerServer } from './TaskRunnerServer.js';


try {
  const server = new TaskRunnerServer(serverConfigurations.search);
  server.startEventListeners()
} catch (err) { console.log(err); }