const accessControlList = <const>[ 
  'write', 
  'read', 
  'deny'
];
export type AccessControlLevel = typeof accessControlList[number];

type Admin = 'ADMIN';

const permissionedUserList = <const>[ // full access, can update permissions on models and on users
  'ARCHICTECT',  // can create models and data sources. writes to models that they have permissions on (creating a model gives write permission)
  'ANALYST' // read only access to models and data sources
]
export type PermissionedUser = typeof permissionedUserList[number];

export type UserLevel = Admin | PermissionedUser;


export interface IACL {
  aclId: string;
  orgId: string;
  modelId: string;
  aclMap: { [level in PermissionedUser]: AccessControlLevel };
}