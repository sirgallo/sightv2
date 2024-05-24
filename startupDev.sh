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
    docker compose -f docker-compose.db.yml up --build -d
   
    echo "seed database with sight user and sight db?: (yes or no)"
    read seed
    
    if [ "$seed" == "yes" ]
    then
      docker exec -it sight_db_replica_0 /scripts/rs-init.sh
    elif [ "$seed" == "no" ]
    then
      echo "skipping seeding of database"
    else
      echo "invalid input for seed"
    fi
  elif [ "$database" == "no" ]
  then
    echo "database not selected for build"
  else
    echo "invalid input for database"
  fi

  echo "build data layer?: (yes or no)"
  read data

  if [ "$data" == "yes" ]
  then
    docker compose -f docker-compose.data.yml up --build -d
  elif [ "$data" == "no" ]
  then
    echo "data layer not selected for build"
  else
    echo "invalid input for data layer"
  fi

  echo "build service layer?: (yes or no)"
  read services

  if [ "$services" == "yes" ]
  then
    docker compose -f docker-compose.io.yml up --build -d
  elif [ "$services" == "no" ]
  then
    echo "service layer not selected for build"
  else
    echo "invalid input for service layer"
  fi
elif [ "$action" == "restart" ]
then  
  export HOSTNAME

  echo "restart database?: (yes or no)"
  read database

  if [ "$database" == "yes" ]
  then
    docker compose -f docker-compose.db.yml start -d
  elif [ "$database" == "no" ]
  then
    echo "database not selected for restart"
  else
    echo "invalid input for database"
  fi

  echo "restart data layer?: (yes or no)"
  read data

  if [ "$data" == "yes" ]
  then
    docker compose -f docker-compose.data.yml start -d
  elif [ "$data" == "no" ]
  then
    echo "data layer not selected for restart"
  else
    echo "invalid input for data layer"
  fi

  echo "restart service layer?: (yes or no)"
  read services

  if [ "$services" == "yes" ]
  then
    docker compose -f docker-compose.io.yml start -d
  elif [ "$services" == "no" ]
  then
    echo "service layer not selected for restart"
  else
    echo "invalid input for service layer"
  fi
else
  echo "input should be build or restart"
fi