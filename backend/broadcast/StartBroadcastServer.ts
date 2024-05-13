import { serverConfigurations } from '../ServerConfigurations.js';
import { BroadcastServer } from './BroadcastServer.js';

try {
  const server = new BroadcastServer(serverConfigurations.broadcast);
  server.startServer();
} catch (err) { console.log(err); }