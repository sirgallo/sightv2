import { SightMongoProvider } from '../../db/SightProvider.js';
import { AccountEndpoints, AccountRequest, AccountResponse } from '../types/Account.js';


export class AccountProvider implements AccountEndpoints {
  constructor(private sightDb: SightMongoProvider) {}

  async details(opts: AccountRequest<'details'>): Promise<AccountResponse> {
    return this.sightDb.user.findOne(opts);
  }

  async update(opts: AccountRequest<'update'>): Promise<AccountResponse> {
    return this.sightDb.user.findOneAndUpdate(opts.filter, { $set: opts.update }, { new: true });
  }

  async delete(opts: AccountRequest<'delete'>): Promise<AccountResponse> {
    return this.sightDb.user.findOneAndDelete(opts);
  }
}