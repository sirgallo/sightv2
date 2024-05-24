import { IACL } from '../../db/models/ACL.js';
import { IOrg } from '../../db/models/Org.js';
import { IUser } from '../../db/models/User.js';


export class AuthIOData {
  static data(): { orgs: IOrg[], users: IUser[], acls: IACL[] } {
    return { 
      orgs: AuthIOData.orgs(),
      users: AuthIOData.users(),
      acls: AuthIOData.acls()
    };
  }

  private static orgs(): IOrg[] {
    return [
      { orgId: 'e4972e74-d5b9-4192-b9c1-0acafc154197', name: 'visible', industry: 'tech' },
      { orgId: '11be6a72-1632-47a3-a59b-71284e1b8324', name: 'starburst', industry: 'tech' }
    ]
  };

  private static users(): IUser[] {
    const orgs = AuthIOData.orgs();
    return [
      {
        userId: '70c4d426-1f86-462e-8e5c-25828314ea68',
        orgId: orgs[0].orgId,
        displayName: 'chris jones',
        email: 'chrisjones@email.com',
        password: 'strongPassword1@234',
        phone: '555-444-3333',
        role: 'ANALYST'
      },
      {
        userId: '16ba0402-e038-4bdf-b5f4-0c847caf1740',
        orgId: orgs[0].orgId,
        displayName: 'brent parker',
        email: 'brentparker@email.com',
        password: 'strongPassword1@234',
        phone: '512-332-8735',
        role: 'ADMIN'
      },
      {
        userId: 'b34a31dd-3761-45e5-8a4a-d344409275fb',
        orgId: orgs[0].orgId,
        displayName: 'jill bennet',
        email: 'jillbennet@email.com',
        password: 'strongPassword1@234',
        phone: '811-222-5430',
        role: 'ARCHITECT'
      },
      {
        userId: '0039e619-d2f0-4e0b-b748-bf48a463e485',
        orgId: orgs[1].orgId,
        displayName: 'john nadler',
        email: 'johnnadler@email.com',
        password: 'strongPassword1@234',
        phone: '211-200-6642',
        role: 'ADMIN'
      },
      {
        userId: '00557170-9a74-4591-a429-900cf61712a8',
        orgId: orgs[1].orgId,
        displayName: 'mary smith',
        email: 'marysmith@email.com',
        password: 'strongPassword1@234',
        phone: '142-112-3245',
        role: 'ANALYST'
      }
    ];
  };

  private static acls(): IACL[] {
    const orgs = AuthIOData.orgs();
    return [
      {
        aclId: '5d214fc5-f36c-4fbf-bd96-c9d12878b1c6',
        orgId: orgs[0].orgId,
        name: 'org 0 acl 0',
        aclMap: { ARCHITECT: 'write', ANALYST: 'read' }
      },
      {
        aclId: '8759c7b6-449b-42be-95d6-477b89a2c452',
        orgId: orgs[0].orgId,
        name: 'org 0 acl 1',
        aclMap: { ARCHITECT: 'read', ANALYST: 'read' }
      },
      {
        aclId: '8885a0d2-47e0-4601-8169-35cb143cf9f7',
        orgId: orgs[0].orgId,
        name: 'org 0 acl 2',
        aclMap: { ARCHITECT: 'write', ANALYST: 'write' }
      },
      {
        aclId: 'f117fd99-d8bd-4c00-babd-f64ed8a35009',
        orgId: orgs[1].orgId,
        name: 'org 1 acl 0',
        aclMap: { ARCHITECT: 'write', ANALYST: 'read' }
      },
      {
        aclId: 'bfd1257d-41a0-486e-945b-5044cb529af2',
        orgId: orgs[1].orgId,
        name: 'org 1 acl 1',
        aclMap: { ARCHITECT: 'write', ANALYST: 'read' }
      }
    ]
  }
}