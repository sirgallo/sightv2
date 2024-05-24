#!/bin/bash

sleep 10
mongosh <<EOF
var config = {
  "_id": "sight_replication_set",
  "version": 1,
  "members": [
    {
      "_id": 1,
      "host": "sight_db_replica_0:27017",
      "priority": 3
    },
    {
      "_id": 2,
      "host": "sight_db_replica_1:27017",
      "priority": 0
    },
    {
      "_id": 3,
      "host": "sight_db_replica_2:27017",
      "priority": 0
    }
  ]
};

rs.initiate(config, { force: true });
rs.status();
EOF

sleep 15
mongosh <<EOF
use sight

db.createUser({
  user: 'sight_dev_user',
  pwd: 'sight_dev_pass_1234',
  roles: [
    {
      role: 'readWrite',
      db: 'sight'
    }
  ],
});


db.createCollection('model', { capped: false });
db.createCollection('entity', { capped: false });
db.createCollection('org', { capped: false });
db.createCollection('relationship', { capped: false });
db.createCollection('search', { capped: false });
db.createCollection('source', { capped: false });
db.createCollection('task', { capped: false });
db.createCollection('taskException', { capped: false });
db.createCollection('taskHistory', { capped: false });
db.createCollection('token', { capped: false });
db.createCollection('user', { capped: false });
EOF