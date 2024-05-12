#!/bin/bash

echo "build or restart services?: (build or restart)"
read action

if [ "$action" == "build" ]
then
  export HOSTNAME

  echo "build database?: (yes or no)"
  read database

  if [ "$database" == "yes" ]
  then
    docker compose -f docker-compose.mongo.yml up --build -d
    docker exec -it sight_db_replica_0 /scripts/rs-init.sh
    sleep 20
  elif [ "$database" == "no" ]
  then
    echo "database not selected for build"
  else
    echo "invalid input for database"
  fi

  echo "build services?: (yes or no)"
  read services

  if [ "$services" == "yes" ]
  then
    docker compose -f docker-compose.sight.yml up --build
  elif [ "$services" == "no" ]
  then
    echo "services not selected for build"
  else
    echo "invalid input for services"
  fi
elif [ "$action" == "restart" ]
then  
  export HOSTNAME

  echo "restart database?: (yes or no)"
  read database

  if [ "$database" == "yes" ]
  then
    docker compose -f docker-compose.mongo.yml start
    sleep 10
  elif [ "$database" == "no" ]
  then
    echo "database not selected for restart"
  else
    echo "invalid input for database"
  fi

  echo "restart services?: (yes or no)"
  read services

  if [ "$services" == "yes" ]
  then
    docker compose -f docker-compose.sight.yml start
  elif [ "$services" == "no" ]
  then
    echo "services not selected for restart"
  else
    echo "invalid input for services"
  fi
else
  echo "input should be build or restart"
fi