#!/bin/bash

readonly truthyInput="input should be yes or no"

echo "Init services for first time? (yes or no):"
read startServices

if [ "$startServices" == "yes" ]
then
  echo "starting services for the first time"
  
  export HOSTNAME

  docker compose -f docker-compose.mongo.yml up --build -d
  docker exec -it sight_db_replica_0 /scripts/rs-init.sh
  sleep 20

  docker-compose -f docker-compose.sight.yml up --build
elif [ "$startServices" == "no" ]
then
  echo "restarting services..."
  
  export HOSTNAME

  docker compose -f docker-compose.mongo.yml start
  sleep 20

  docker compose -f docker-compose.sight.yml up
else
  echo truthyInput
fi