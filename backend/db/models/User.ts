import { Schema, Document } from 'mongoose';

import { UserLevel } from './ACL.js';


export const UserCollectionName = 'user';
export const TokenCollectionName = 'token';


//======================== mongo user interfaces


export interface IUser {
  userId: string;
  email: string;
  password: string;
  displayName: string;
  phone: string;
  org: string;
  userLevel: UserLevel;

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}

export interface IToken {
  userId: string;
  refreshToken: string;

  createdAt?: Date; // injected
  updatedAt?: Date; // injected
}


//======================== mongo user schemas


export interface UserDocument extends IUser, Document {} // need to extend mongo document for schema to include all mongo document fields
export interface TokenDocument extends IToken, Document {} // need to extend mongo document for schema to include all mongo document fields

export const UserSchema: Schema<UserDocument> = new Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: false },
  phone: { type: String, required: true, unique: true },
  org: { type: String, required: true, unique: false },
  displayName: { type: String, required: true, unique: true },
  userLevel: { type: String, required: true, unique: false }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: UserCollectionName,
  minimize: false
});

export const TokenSchema: Schema<TokenDocument> = new Schema({
  userId: { type: String, required: true, unique: true },
  refreshToken: { type: String, required: true, unique: true }
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }, 
  collection: TokenCollectionName,
  minimize: false
});


//======================== mongo user indexes


UserSchema.index({ userId: 1 });
UserSchema.index({ email: 1 });

TokenSchema.index({ userId: 1 });