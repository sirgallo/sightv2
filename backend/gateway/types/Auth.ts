import { IUser } from '../../db/models/User.js';


export type AuthRequest<T extends keyof AuthEndpoints> = 
  T extends 'authenticate'
  ? Pick<IUser, 'email' | 'password'>
  : T extends 'register'
  ? IUser
  : never;

export interface AuthResponse {
  token: string;
}
  

export interface AuthEndpoints {
  authenticate: (opts: AuthRequest<'authenticate'>) => Promise<AuthResponse>;
  register: (opts: AuthRequest<'register'>) => Promise<AuthResponse>
}