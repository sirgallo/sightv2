import { serverConfigurations } from '../ServerConfigurations.js';
import { GatewayServer } from './GatewayServer.js';


try {
  const server = new GatewayServer(serverConfigurations.gateway);
  await server.startServer();
} catch (err) { 
  console.log(err);
  process.exit(1); 
}