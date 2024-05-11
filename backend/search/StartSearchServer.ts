import { serverConfigurations } from '../ServerConfigurations.js';
import { SearchServer } from './SearchServer.js';


try {
  const server = new SearchServer(serverConfigurations.search);
  server.startServer();
} catch (err) { console.log(err); }