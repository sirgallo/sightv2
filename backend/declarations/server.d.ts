import 'express';

import { UserRole } from '../db/models/ACL.js';
import { IUser } from '../db/models/User.js';


declare module 'express' {
  export interface Request {
    user?: Partial<Pick<IUser, 'userId' | 'displayName' | 'org' | 'role'>>;
  }
}