import { IUser } from '../../db/models/User.js';


export type AccountRequest<T extends keyof AccountEndpoints> = 
  T extends 'details'
  ? Pick<IUser, 'email'> | Pick<IUser, 'userId'>
  : T extends 'update'
  ? { filter: Pick<IUser, 'userId'>, update: Partial<Omit<IUser, 'userId' | 'email' | 'org'>> }
  : T extends 'delete'
  ? Pick<IUser, 'userId'>
  : never;

export type AccountResponse = Pick<IUser, 'userId' | 'email' | 'org' | 'phone' | 'role'>
  

export interface AccountEndpoints {
  details: (opts: AccountRequest<'details'>) => Promise<AccountResponse>;
  update: (opts: AccountRequest<'update'>) => Promise<AccountResponse>;
  delete: (opts: AccountRequest<'delete'>) =>  Promise<AccountResponse>;
}