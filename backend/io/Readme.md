# io

### a custom test suite for sightv2


## overview

`io` is a utility module in sight that makes it straightforward to write tests and create mock data for tests. The directory is separated into two main parts, the `io/data` and `io/runner` directories.

`io/data` handles mock data for tests. Each file is expected to follow the same naming convention:

`<name-of-data-mock>.sight.io.data.ts`

Each data file should export an io data class that includes static methods with associated mock data.

`io/runner` handles executing tests. Each file is expected to follow the same naming convention, similar to `io/data` files:

`<name-of-runner>.sight.io.runner.ts`

Each runner will extend the base runner class, located in [sight.io.runner](sight.io.runner.ts).

Runners are expected to have the following format (loosely):

```ts
import { SightIOConnection } from '../../io/sight.io.connect.js'; // utility class with static members for different connection profiles
import { SightIORunner, sightIORunner } from '../../io/sight.io.runner.js';


class MyIORunner extends SightIORunner<boolean> {
  constructor() { super() }

  async runIO(): Promise<boolean> {
    // main handler, executed on start in base class, implement test logic here
    return true;
  }

  // any additional methods can be added as private members
}


sightIORunner({  // use the included utility to run the above processor
  ioRunner: new MyIORunner(),
  saveResultsToDisk: false // this is optional
});
```

Runners, when executed, will perform the following:

  1. start timer
  2. invoke runIO method
  3. return timestamped results with duration of time in ms


## deploy locally

To run tests against sight locally, ensure first that the local cluster deployment is running in docker. This can be done using the `./startupDev.sh` script, which provides guided input for deploying the services.

To run an io runner, first build the project (assuming you are at the root directory of the project):
```bash
cd ./backend
npm ci // run this if you need node installs
npm run build:all
```

Then, run your test/function by executing the appropriate runner file:
```bash
cd ./backend
node dist/io/runner/<your-compiled-test>
```

for local development purposes, the ports for the docker containers for mongo are bound to the host machine so the io runners can directly connect to the db.