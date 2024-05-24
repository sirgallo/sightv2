import { ServerConfiguration } from './server/types/ServerConfiguration.js';
import { envLoader } from './common/EnvLoader.js';


export type ApplicableSystem = 
  'broadcast'
  | 'gateway' 
  | 'search' 
  | 'taskrunner';

export const serverConfigurations: { [server in ApplicableSystem]: ServerConfiguration<server> } = {
  broadcast: {
    root: '/broadcast',
    port: 1000,
    name: 'broadcast api',
    numOfCpus: 1,
    version: envLoader.SIGHT_PLATFORM_VERSION,
  },
  gateway: {
    root: '/gateway',
    port: 1234,
    name: 'gateway api',
    numOfCpus: 1,
    version: envLoader.SIGHT_PLATFORM_VERSION
  },
  search: {
    root: '/search',
    port: 2345,
    name: 'search api',
    numOfCpus: 1,
    version: envLoader.SIGHT_PLATFORM_VERSION
  },
  taskrunner: {
    root: '/taskrunner',
    port: 3456,
    name: 'taskrunner api',
    numOfCpus: 1,
    version: envLoader.SIGHT_PLATFORM_VERSION
  }
};