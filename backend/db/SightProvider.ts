import { Document, Model, Schema } from 'mongoose';

import { MongoProvider } from '../core/data/providers/MongoProvider.js';
import { MongoOpts } from '../core/data/types/Mongo.js';
import { NodeUtil } from '../core/utils/Node.js';
import { ACLDocument, ACLSchema } from './models/ACL.js';
import { EntityDocument, EntitySchema, ModelDocument, ModelSchema, RelationshipDocument, RelationshipSchema } from './models/Model.js';
import { OrgDocument, OrgSchema } from './models/Org.js';
import { SearchDocument, SearchSchema } from './models/Search.js';
import { SourceDocument, SourceSchema } from './models/Source.js';
import { TokenDocument, TokenSchema, UserDocument, UserSchema } from './models/User.js';
import { TaskDocument, TaskSchema, TaskExceptionDocument, TaskExceptionSchema, TaskHistoryDocument, TaskHistorySchema } from './models/Task.js';
import { DBMap } from './models/Configure.js';


export class SightMongoProvider extends MongoProvider {
  acl: Model<ACLDocument>;
  entity: Model<EntityDocument>;
  relationship: Model<RelationshipDocument>;
  model: Model<ModelDocument>;
  org: Model<OrgDocument>;
  search: Model<SearchDocument>;
  source: Model<SourceDocument>;
  task: Model<TaskDocument>;
  taskException: Model<TaskExceptionDocument>;
  taskHistory: Model<TaskHistoryDocument>;
  token: Model<TokenDocument>;
  user: Model<UserDocument>;

  private static instance: SightMongoProvider;
  private constructor() { super(); }

  static async getInstance(opts?: MongoOpts): Promise<SightMongoProvider> {
    try {
      if (! SightMongoProvider.instance) { 
        SightMongoProvider.instance = new SightMongoProvider();
        await SightMongoProvider.instance.createNewConnection(opts);
      }
    } catch (err) {
      SightMongoProvider.instance.zLog.error(`get instance error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    } finally { return SightMongoProvider.instance; }
}

  initModels() {
    this.acl = this.modelValidator<ACLDocument>(dbConf.sight.collections.acl);
    this.entity = this.modelValidator<EntityDocument>(dbConf.sight.collections.entity);
    this.relationship = this.modelValidator<RelationshipDocument>(dbConf.sight.collections.relationship);
    this.model = this.modelValidator<ModelDocument>(dbConf.sight.collections.model);
    this.org = this.modelValidator<OrgDocument>(dbConf.sight.collections.org);
    this.search = this.modelValidator<SearchDocument>(dbConf.sight.collections.search);
    this.source = this.modelValidator<SourceDocument>(dbConf.sight.collections.source);
    this.task = this.modelValidator<TaskDocument>(dbConf.sight.collections.task);
    this.taskException = this.modelValidator<TaskExceptionDocument>(dbConf.sight.collections.taskException);
    this.taskHistory = this.modelValidator<TaskHistoryDocument>(dbConf.sight.collections.task);
    this.token = this.modelValidator<TokenDocument>(dbConf.sight.collections.token);
    this.user = this.modelValidator<UserDocument>(dbConf.sight.collections.user);
  }

  private modelValidator = <T extends Document>(model: keyof typeof dbConf.sight.collections) => {
    if (this.conn.models[model] != null) return this.conn.model<T>(dbConf.sight.collections[model]);
    return this.conn.model<T>(dbConf.sight.collections[model], this.getSchemaForModel(model));
  }

  private getSchemaForModel(model: keyof typeof dbConf.sight.collections): Schema {
    if (model === 'acl') return ACLSchema;
    if (model === 'entity') return EntitySchema;
    if (model === 'relationship') return RelationshipSchema;
    if (model === 'model') return ModelSchema;
    if (model === 'org') return OrgSchema;
    if (model === 'search') return SearchSchema;
    if (model === 'source') return SourceSchema;
    if (model === 'task') return TaskSchema;
    if (model === 'taskException') return TaskExceptionSchema;
    if (model === 'taskHistory') return TaskHistorySchema;
    if (model === 'token') return TokenSchema;
    if (model === 'user') return UserSchema;
  }
}


type DBName = 'sight';
export const dbConf: DBMap<DBName> = {
  sight: {
    name: 'sight',
    collections: {
      acl: 'acl',
      entity: 'entity',
      relationship: 'relationship',
      model: 'model',
      org: 'org',
      search: 'search',
      source: 'source',
      task: 'task',
      taskHistory: 'taskHistory',
      taskException: 'taskException',
      token: 'token',
      user: 'user'
    }
  }
};