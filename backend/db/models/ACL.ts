import { Document, Schema } from 'mongoose';


export const ACLCollectionName = 'acl';

const accessControlList = <const>[ 
  'write', 
  'read', 
  'deny'
];
export type AccessControlLevel = typeof accessControlList[number];

type Admin = 'ADMIN';

const permissionedUserList = <const>[ // full access, can update permissions on models and on users
  'ARCHITECT',  // can create models and data sources. writes to models that they have permissions on (creating a model gives write permission)
  'ANALYST' // read only access to models and data sources
];
export type PermissionedUser = typeof permissionedUserList[number];

export type UserRole = Admin | PermissionedUser;


//======================== mongo acl interfaces


export interface IACL {
  aclId: string;
  orgId: string;
  name: string;
  aclMap: { [level in PermissionedUser]: AccessControlLevel };
}


//======================== mongo acl schemas


export interface ACLDocument extends IACL, Document {}

export const ACLSchema: Schema<ACLDocument> = new Schema({
  aclId: { type: String, required: true, unique: true },
  orgId: { type: String, required: true, unique: false },
  name: { type: String, required: true, unique: true },
  aclMap:  { type: Schema.Types.Mixed, required: true, unique: false },
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: ACLCollectionName,
  minimize: false
});


//======================== mongo acl indexes


ACLSchema.index({ aclId: 1 });
ACLSchema.index({ orgId: 1, aclId: 1 });
ACLSchema.index({ name: 1 });