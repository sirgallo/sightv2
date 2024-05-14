#!/bin/bash

readonly truthyInput="input should be yes or no"

echo "remove or stop services?: (remove or stop)"
read action

if [ "$action" == "remove" ]
then
  echo "removing services and their underlying containers..."

  echo "remove service layer?: (yes or no)"
  read services

  if [ "$services" == "yes" ]
  then
    docker compose -f docker-compose.service.yml down
  elif [ "$services" == "no" ]
  then
    echo "service layer not selected for removal"
  else
    echo "invalid input for service layer"
  fi

  echo "remove data layer?: (yes or no)"
  read data

  if [ "$data" == "yes" ]
  then
    docker compose -f docker-compose.data.yml down
  elif [ "$data" == "no" ]
  then
    echo "data layer not selected for removal"
  else
    echo "invalid input for data layer"
  fi

  echo "remove database layer?: (yes or no)"
  read database

  if [ "$database" == "yes" ]
  then
    docker compose -f docker-compose.db.yml down
  elif [ "$database" == "no" ]
  then
    echo "database not selected for removal"
  else
    echo "invalid input for database"
  fi
elif [ "$action" == "stop" ]
then
  echo "stopping services...can be restarted"
  
  echo "stop service layer?: (yes or no)"
  read services

  if [ "$services" == "yes" ]
  then
    docker compose -f docker-compose.service.yml stop
  elif [ "$services" == "no" ]
  then
    echo "service layer not selected for stop"
  else
    echo "invalid input for service layer"
  fi

  echo "stop data layer?: (yes or no)"
  read data

  if [ "$data" == "yes" ]
  then
    docker compose -f docker-compose.data.yml stop
  elif [ "$data" == "no" ]
  then
    echo "data layer not selected for stop"
  else
    echo "invalid input for data layer"
  fi

  echo "stop database layer?: (yes or no)"
  read database

  if [ "$database" == "yes" ]
  then
    docker compose -f docker-compose.db.yml stop
  elif [ "$database" == "no" ]
  then
    echo "database not selected for stop"
  else
    echo "invalid input for database"
  fi
else
  echo "input should be build or restart"
fi