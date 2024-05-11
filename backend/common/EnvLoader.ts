import { env } from 'process';


type EnvironementKey =
  'JWT_SECRET'
  | 'JWT_TIMEOUT'
  | 'JWT_REFRESH_SECRET'
  | 'JWT_REFRESH_TIMEOUT'
  | 'PASSWORD_SALT_ROUNDS'
  | 'SIGHT_DB_HOSTS'
  | 'SIGHT_DB_USER'
  | 'SIGHT_DB_PASS'
  | 'SIGHT_DB_REPLICA_SET'
  | 'SIGHT_PLATFORM_VERSION';

type EnvValue<T extends EnvironementKey> =
  T extends 
    'JWT_SECRET' 
    | 'JWT_REFRESH_SECRET'
  ? `${string}-${string}-${string}-${string}-${string}`
  : T extends 
    'JWT_TIMEOUT'
    | 'JWT_REFRESH_TIMEOUT'
    | 'PASSWORD_SALT_ROUNDS'
  ? number
  : T extends
    'SIGHT_DB_USER' 
    | 'SIGHT_DB_PASS' 
    | 'SIGHT_DB_REPLICA_SET'
    | 'SIGHT_PLATFORM_VERSION'
  ? string
  :T extends 
    'SIGHT_DB_HOSTS' 
  ? string[]
  : never;


const envValueValidator = <T extends EnvironementKey>(envKey: T): EnvValue<T> => {
  if (envKey === 'JWT_SECRET') return (env[envKey] ?? 'c9c721c3-b2fa-45a9-b1fb-8ed993469843') as EnvValue<T>;
  if (envKey === 'JWT_TIMEOUT') return parseInt(env[envKey] ?? '3600') as EnvValue<T>;
  if (envKey === 'JWT_REFRESH_SECRET') return (env[envKey] ?? 'c9c721c3-b2fa-45a9-b1fb-8ed993469843') as EnvValue<T>;
  if (envKey === 'JWT_REFRESH_TIMEOUT') return parseInt(env[envKey] ?? '86400') as EnvValue<T>;
  if (envKey === 'PASSWORD_SALT_ROUNDS') return parseInt(env[envKey] ?? '10') as EnvValue<T>;
  if (envKey === 'SIGHT_DB_HOSTS') return (env[envKey] ?? 'sight_db_replica_0:27017,sight_db_replica_1:27017,sight_db_replica_2:27017') as EnvValue<T>;
  if (envKey === 'SIGHT_DB_USER') return (env[envKey] ?? 'sight_dev_user') as EnvValue<T>;
  if (envKey === 'SIGHT_DB_PASS') return (env[envKey] ?? 'sight_dev_pass_1234?') as EnvValue<T>;
  if (envKey === 'SIGHT_DB_REPLICA_SET') return (env[envKey] ?? 'sight_replication_set') as EnvValue<T>;
  if (envKey === 'SIGHT_PLATFORM_VERSION') return (env[envKey] ?? '0.0.1-dev') as EnvValue<T>;
  
  throw new Error('invalid environment key specified in value validator');
};

export const envLoader: { [envKey in EnvironementKey]: EnvValue<envKey> } = {
  'JWT_SECRET': envValueValidator('JWT_SECRET'),
  'JWT_TIMEOUT': envValueValidator('JWT_TIMEOUT'),
  'JWT_REFRESH_SECRET': envValueValidator('JWT_REFRESH_SECRET'),
  'JWT_REFRESH_TIMEOUT': envValueValidator('JWT_REFRESH_TIMEOUT'),
  'PASSWORD_SALT_ROUNDS': envValueValidator('PASSWORD_SALT_ROUNDS'),
  'SIGHT_DB_HOSTS': envValueValidator('SIGHT_DB_HOSTS'),
  'SIGHT_DB_USER': envValueValidator('SIGHT_DB_USER'),
  'SIGHT_DB_PASS': envValueValidator('SIGHT_DB_PASS'),
  'SIGHT_DB_REPLICA_SET': envValueValidator('SIGHT_DB_REPLICA_SET'),
  'SIGHT_PLATFORM_VERSION': envValueValidator('SIGHT_PLATFORM_VERSION')
};