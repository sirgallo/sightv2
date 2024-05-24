import { QueryOptions } from 'mysql2'


export class MariaDbSearchGenerator {
  static async parse(ctxSearch: string): Promise<QueryOptions> {
    return { sql: ctxSearch };
  }
}