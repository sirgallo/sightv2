# Deployment


## local

### certs

run [generateCerts](./generateCerts.sh) to guide through setting up root ca and service certs for sight.
```bash
./generateCerts.sh
```

certs are generated under `~/sight/certs` on the host machine.

### env

Export the following to your path:
```bash
export JWT_SECRET=<your-jwt-secret>
export JWT_TIMEOUT=<your-jwt-timeout>
export JWT_REFRESH_SECRET=<your-jwt-refresh-secret>
export JWT_REFRESH_TIMEOUT=<your-jwt-refresh-timeout>
export PASSWORD_SALT_ROUNDS=<your-pass-salt-rounds>
export SIGHT_DB_HOST=<your-mongo-db-host>
export SIGHT_DB_PORT=<your-mongo-db-port>
export SIGHT_DB_USER=<your-mongo-db-user>
export SIGHT_DB_PASS=<your-mongo-db-pass>
export SIGHT_PLATFORM_VERSION=<current-sight-version>

source ~/.zshrc
```

### build

in the `root` of the project, first build `Dockerfile.buildapi`, which creates a nodejs preimage shared between the different services:
```bash
./buildpreimages.sh
```

### start

then, to run a development cluster, deploy using docker through [startupDev](./startupDev.sh):
```bash
./startupDev.sh
```

### stop

to stop the services, run:
```bash
./stopDev.sh
```


## production