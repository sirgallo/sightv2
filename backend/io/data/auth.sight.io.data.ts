import { IACL } from 'db/models/ACL.js';
import { CryptoUtil } from '../../core/utils/Crypto.js';
import { IOrg } from '../../db/models/Org.js';
import { IUser } from '../../db/models/User.js';


export class MockAuthData {
  static orgs(): IOrg[] {
    const now = new Date();
    return [
      {
        orgId: CryptoUtil.generateSecureUUID(),
        name: 'visible',
        industry: 'tech',
        createdAt: now,
        updatedAt: now
      },
      {
        orgId: CryptoUtil.generateSecureUUID(),
        name: 'starburst',
        industry: 'tech',
        createdAt: now,
        updatedAt: now
      }
    ]
  };

  static users(): IUser[] {
    const orgs = MockAuthData.orgs();
    const now = new Date();

    return [
      {
        userId: CryptoUtil.generateSecureUUID(),
        orgId: orgs[0].orgId,
        displayName: 'chris jones',
        email: 'chrisjones@email.com',
        password: 'strongPassword1@234',
        phone: '555-444-3333',
        role: 'ANALYST',
        createdAt: now,
        updatedAt: now
      },
      {
        userId: CryptoUtil.generateSecureUUID(),
        orgId: orgs[0].orgId,
        displayName: 'brent parker',
        email: 'brentparker@email.com',
        password: 'strongPassword1@234',
        phone: '512-332-8735',
        role: 'ADMIN',
        createdAt: now,
        updatedAt: now
      },
      {
        userId: CryptoUtil.generateSecureUUID(),
        orgId: orgs[0].orgId,
        displayName: 'jill bennet',
        email: 'jillbennet@email.com',
        password: 'strongPassword1@234',
        phone: '811-222-5430',
        role: 'ARCHITECT',
        createdAt: now,
        updatedAt: now
      },
      {
        userId: CryptoUtil.generateSecureUUID(),
        orgId: orgs[1].orgId,
        displayName: 'john nadler',
        email: 'johnnadler@email.com',
        password: 'strongPassword1@234',
        phone: '211-200-6642',
        role: 'ADMIN'
      },
      {
        userId: CryptoUtil.generateSecureUUID(),
        orgId: orgs[1].orgId,
        displayName: 'mary smith',
        email: 'marysmith@email.com',
        password: 'strongPassword1@234',
        phone: '142-112-3245',
        role: 'ANALYST'
      }
    ];
  };

  static acls(): IACL[] {
    const orgs = MockAuthData.orgs();
    const now = new Date();

    return [
      {
        aclId: CryptoUtil.generateSecureUUID(),
        orgId: orgs[0].orgId,
        modelId: CryptoUtil.generateSecureUUID(),
        aclMap: {
          ARCHITECT: 'write',
          ANALYST: 'read'
        }
      },
      {
        aclId: CryptoUtil.generateSecureUUID(),
        orgId: orgs[0].orgId,
        modelId: CryptoUtil.generateSecureUUID(),
        aclMap: {
          ARCHITECT: 'read',
          ANALYST: 'read'
        }
      },
      {
        aclId: CryptoUtil.generateSecureUUID(),
        orgId: orgs[0].orgId,
        modelId: CryptoUtil.generateSecureUUID(),
        aclMap: {
          ARCHITECT: 'write',
          ANALYST: 'write'
        }
      },
      {
        aclId: CryptoUtil.generateSecureUUID(),
        orgId: orgs[1].orgId,
        modelId: CryptoUtil.generateSecureUUID(),
        aclMap: {
          ARCHITECT: 'write',
          ANALYST: 'read'
        }
      },
      {
        aclId: CryptoUtil.generateSecureUUID(),
        orgId: orgs[1].orgId,
        modelId: CryptoUtil.generateSecureUUID(),
        aclMap: {
          ARCHITECT: 'write',
          ANALYST: 'read'
        }
      }
    ]
  }
}