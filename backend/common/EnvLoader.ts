import { hostname } from 'os';
import { env } from 'process';


type ServiceCluster = 'io' | 'stg' | 'prod';
type JsonWebToken = `${string}-${string}-${string}-${string}-${string}`;
type RedisDeployment = 'single' | 'cluster';


type EnvironementKey =
  'JWT_SECRET'
  | 'JWT_TIMEOUT'
  | 'JWT_REFRESH_SECRET'
  | 'JWT_REFRESH_TIMEOUT'
  | 'PASSWORD_SALT_ROUNDS'
  | 'SIGHT_DB_HOSTS'
  | 'SIGHT_DB_HOSTS_DEV'
  | 'SIGHT_DB_DEFAULT_PORT'
  | 'SIGHT_DB_USER'
  | 'SIGHT_DB_PASS'
  | 'SIGHT_DB_REPLICA_SET'
  | 'SIGHT_ETCD_HOSTS'
  | 'SIGHT_ETCD_ELECTION_TIMEOUT'
  | 'SIGHT_ETCD_HEARTBEAT_TIMEOUT'
  | 'SIGHT_REDIS_HOSTS'
  | 'SIGHT_REDIS_PORT'
  | 'SIGHT_REDIS_USER'
  | 'SIGHT_REDIS_PASS'
  | 'SIGHT_REDIS_DEPLOYMENT'
  | 'SIGHT_PLATFORM_ENDPOINT'
  | 'SIGHT_PLATFORM_VERSION'
  | 'SIGHT_SERVICE_CLUSTER';

type EnvValue<T extends EnvironementKey> =
  T extends 
    'JWT_SECRET' 
    | 'JWT_REFRESH_SECRET'
  ? JsonWebToken
  : T extends 
    'SIGHT_REDIS_DEPLOYMENT'
  ? RedisDeployment
  : T extends 
    'SIGHT_SERVICE_CLUSTER'
  ? ServiceCluster
  : T extends 
    'JWT_TIMEOUT'
    | 'JWT_REFRESH_TIMEOUT'
    | 'PASSWORD_SALT_ROUNDS'
    | 'SIGHT_DB_DEFAULT_PORT'
    | 'SIGHT_REDIS_PORT'
    | 'SIGHT_ETCD_ELECTION_TIMEOUT'
    | 'SIGHT_ETCD_HEARTBEAT_TIMEOUT'
  ? number
  : T extends
     'SIGHT_DB_HOSTS'
    | 'SIGHT_DB_HOSTS_DEV'
    | 'SIGHT_DB_USER' 
    | 'SIGHT_DB_PASS' 
    | 'SIGHT_DB_REPLICA_SET'
    | 'SIGHT_ETCD_HOSTS'
    | 'SIGHT_REDIS_HOSTS'
    | 'SIGHT_REDIS_USER'
    | 'SIGHT_REDIS_PASS'
    | 'SIGHT_PLATFORM_ENDPOINT'
    | 'SIGHT_PLATFORM_VERSION'
  ? string
  : never;


const envValueValidator = <T extends EnvironementKey>(envKey: T): EnvValue<T> => {
  const validateValue = (defaultVal: string) => {
    const value = env[envKey];
    if (! value || value.trim() === '') return defaultVal;
    console.log(`existing value: ${value}`);
    return value;
  }

  if (envKey === 'JWT_SECRET') return validateValue('c9c721c3-b2fa-45a9-b1fb-8ed993469843') as EnvValue<T>;
  if (envKey === 'JWT_TIMEOUT') return parseInt(validateValue('3600')) as EnvValue<T>;
  if (envKey === 'JWT_REFRESH_SECRET') return validateValue('c9c721c3-b2fa-45a9-b1fb-8ed993469843') as EnvValue<T>;
  if (envKey === 'JWT_REFRESH_TIMEOUT') return parseInt(validateValue('86400')) as EnvValue<T>;
  if (envKey === 'PASSWORD_SALT_ROUNDS') return parseInt(validateValue('10'))as EnvValue<T>;
  if (envKey === 'SIGHT_DB_HOSTS') return validateValue('sight_db_replica_0:27017,sight_db_replica_1:27017,sight_db_replica_2:27017') as EnvValue<T>;
  if (envKey === 'SIGHT_DB_HOSTS_DEV') return validateValue('localhost:27017,localhost:27018,localhost:27019') as EnvValue<T>;
  if (envKey === 'SIGHT_DB_DEFAULT_PORT') return validateValue('27017') as EnvValue<T>;
  if (envKey === 'SIGHT_DB_USER') return validateValue('sight_dev_user') as EnvValue<T>;
  if (envKey === 'SIGHT_DB_PASS') return validateValue('sight_dev_pass_1234') as EnvValue<T>;
  if (envKey === 'SIGHT_DB_REPLICA_SET') return validateValue('sight_replication_set') as EnvValue<T>;
  if (envKey === 'SIGHT_ETCD_HOSTS') return validateValue('sight_etcd_0:2379,sight_etcd_1:2379,sight_etcd_2:2379') as EnvValue<T>;
  if (envKey === 'SIGHT_ETCD_ELECTION_TIMEOUT') return parseInt(validateValue('1000')) as EnvValue<T>;
  if (envKey === 'SIGHT_ETCD_HEARTBEAT_TIMEOUT') return parseInt(validateValue('250')) as EnvValue<T>;
  if (envKey === 'SIGHT_REDIS_HOSTS') return validateValue('sight_redis_0,sight_redis_1,sight_redis_2') as EnvValue<T>;
  if (envKey === 'SIGHT_REDIS_PORT') return parseInt(validateValue('6379')) as EnvValue<T>;
  if (envKey === 'SIGHT_REDIS_USER') return validateValue('sight_dev_user') as EnvValue<T>;
  if (envKey === 'SIGHT_REDIS_PASS') return validateValue('sight_dev_pass_1234') as EnvValue<T>;
  if (envKey === 'SIGHT_REDIS_DEPLOYMENT') return validateValue('cluster') as EnvValue<T>;
  if (envKey === 'SIGHT_PLATFORM_ENDPOINT') return validateValue(hostname()) as EnvValue<T>;
  if (envKey === 'SIGHT_PLATFORM_VERSION') return validateValue('0.0.1-dev') as EnvValue<T>;
  if (envKey === 'SIGHT_SERVICE_CLUSTER') return validateValue('io') as EnvValue<T>;
  
  throw new Error('invalid environment key specified in value validator');
};


type EnvLoader<T extends EnvironementKey> = { [envKey in T]: EnvValue<envKey> }
export const envLoader:EnvLoader<EnvironementKey> = {
  'JWT_SECRET': envValueValidator('JWT_SECRET'),
  'JWT_TIMEOUT': envValueValidator('JWT_TIMEOUT'),
  'JWT_REFRESH_SECRET': envValueValidator('JWT_REFRESH_SECRET'),
  'JWT_REFRESH_TIMEOUT': envValueValidator('JWT_REFRESH_TIMEOUT'),
  'PASSWORD_SALT_ROUNDS': envValueValidator('PASSWORD_SALT_ROUNDS'),
  'SIGHT_DB_HOSTS': envValueValidator('SIGHT_DB_HOSTS'),
  'SIGHT_DB_HOSTS_DEV': envValueValidator('SIGHT_DB_HOSTS_DEV'),
  'SIGHT_DB_DEFAULT_PORT': envValueValidator('SIGHT_DB_DEFAULT_PORT'),
  'SIGHT_DB_USER': envValueValidator('SIGHT_DB_USER'),
  'SIGHT_DB_PASS': envValueValidator('SIGHT_DB_PASS'),
  'SIGHT_DB_REPLICA_SET': envValueValidator('SIGHT_DB_REPLICA_SET'),
  'SIGHT_ETCD_HOSTS': envValueValidator('SIGHT_ETCD_HOSTS'),
  'SIGHT_ETCD_ELECTION_TIMEOUT': envValueValidator('SIGHT_ETCD_ELECTION_TIMEOUT'),
  'SIGHT_ETCD_HEARTBEAT_TIMEOUT': envValueValidator('SIGHT_ETCD_HEARTBEAT_TIMEOUT'),
  'SIGHT_REDIS_HOSTS': envValueValidator('SIGHT_REDIS_HOSTS'),
  'SIGHT_REDIS_PORT': envValueValidator('SIGHT_REDIS_PORT'),
  'SIGHT_REDIS_USER': envValueValidator('SIGHT_REDIS_USER'),
  'SIGHT_REDIS_PASS': envValueValidator('SIGHT_REDIS_PASS'),
  'SIGHT_REDIS_DEPLOYMENT': envValueValidator('SIGHT_REDIS_DEPLOYMENT'),
  'SIGHT_PLATFORM_ENDPOINT': envValueValidator('SIGHT_PLATFORM_ENDPOINT'),
  'SIGHT_PLATFORM_VERSION': envValueValidator('SIGHT_PLATFORM_VERSION'),
  'SIGHT_SERVICE_CLUSTER': envValueValidator('SIGHT_SERVICE_CLUSTER')
};