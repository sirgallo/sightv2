import { LogProvider } from '../log/LogProvider.js';
import { UserRole } from '../../db/models/ACL.js';


export class ACLMiddleware {  
  private static zLog = new LogProvider(ACLMiddleware.name);
  
  static isEligible(roles: { incoming: UserRole, expected: UserRole }): boolean {
    if (roles.incoming === 'ADMIN') return true;

    if (roles.incoming === 'ARCHITECT') {
      if (roles.expected === 'ARCHITECT') return true;
      if (roles.expected === 'ANALYST') return true;
    }

    if (roles.incoming === 'ANALYST') {
      if (roles.expected === 'ANALYST') return true;
    }

    return false;
  }
}