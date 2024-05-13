import { createConnection, Connection, ConnectionOptions } from 'mysql2/promise';

import { LogProvider } from '../../log/LogProvider.js';
import { MariaDbOperation, MariaDbQueryResponse } from '../types/MariaDb.js';



export class MariaDbProvider {
  private __conn: Connection;
  constructor(private __opts: ConnectionOptions, private __zLog = new LogProvider(MariaDbProvider.name)) {}

  async getConnection() { this.__conn = await createConnection(this.__opts); }

  async execute(sql: string, type: MariaDbOperation, args?: (string | number)[]): Promise<MariaDbQueryResponse> {
    try {
      switch (type) {
        case 'close':
          await this.__conn.end();
          this.__zLog.info(`mariadb connection closed`);
          return null;
        case 'query':
          const [ rows, fields ] = await this.__conn.execute(sql, args);
          
          this.__zLog.logTable(rows, fields.map(field => field.name));
          return { rows, fields };
        default:
          await this.__conn.execute(sql);
          this.__zLog.info(`query type ${type} success`);
          return null;
      }
    } catch (err) {
      this.__zLog.error({ err });
      throw err;
    }
  }
}