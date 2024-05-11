import { Model } from 'mongoose';

import { MongoProvider } from '../core/data/providers/MongoProvider.js';
import { ModelDocument, ModelSchema } from './models/Model.js';
import { SearchDocument, SearchSchema } from './models/Search.js';
import { SourceDocument, SourceSchema } from './models/Source.js';
import { TokenDocument, TokenSchema, UserDocument, UserSchema } from './models/User.js';
import { TaskDocument, TaskSchema, TaskExceptionDocument, TaskExceptionSchema, TaskHistoryDocument, TaskHistorySchema } from './models/Task.js'
import { dbConf } from './DbConf.js';


export class SightMongoProvider extends MongoProvider {
  model: Model<ModelDocument>;
  search: Model<SearchDocument>;
  source: Model<SourceDocument>;
  task: Model<TaskDocument>;
  taskException: Model<TaskExceptionDocument>;
  taskHistory: Model<TaskHistoryDocument>;
  token: Model<TokenDocument>;
  user: Model<UserDocument>;
  
  initModels() {
    this.model = this.conn.model<ModelDocument>(dbConf.sight.collections.model, ModelSchema);
    this.search = this.conn.model<SearchDocument>(dbConf.sight.collections.search, SearchSchema);
    this.source = this.conn.model<SourceDocument>(dbConf.sight.collections.source, SourceSchema);
    this.task = this.conn.model<TaskDocument>(dbConf.sight.collections.task, TaskSchema);
    this.taskException = this.conn.model<TaskExceptionDocument>(dbConf.sight.collections.taskException, TaskExceptionSchema);
    this.taskHistory = this.conn.model<TaskHistoryDocument>(dbConf.sight.collections.task, TaskHistorySchema);
    this.token = this.conn.model<TokenDocument>(dbConf.sight.collections.token, TokenSchema);
    this.user = this.conn.model<UserDocument>(dbConf.sight.collections.user, UserSchema);
  }
}