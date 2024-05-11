import { createConnection, Connection, ConnectionOptions } from 'mysql2/promise';

import { LogProvider } from '../../log/LogProvider.js';
import { MariaDbOperation, MariaDbQueryResponse } from '../types/MariaDb.js';



export class MariaDbProvider {
  private conn: Connection;
  constructor(private opts: ConnectionOptions, private zLog = new LogProvider(MariaDbProvider.name)) {}

  async getConnection() { this.conn = await createConnection(this.opts); }

  async execute(sql: string, type: MariaDbOperation, args?: (string | number)[]): Promise<MariaDbQueryResponse> {
    try {
      switch (type) {
        case 'close':
          await this.conn.end();
          this.zLog.info(`mariadb connection closed`);
          return null;
        case 'query':
          const [ rows, fields ] = await this.conn.execute(sql, args);
          
          this.zLog.logTable(rows, fields.map(field => field.name));
          return { rows, fields };
        default:
          await this.conn.execute(sql);
          this.zLog.info(`query type ${type} success`);
          return null;
      }
    } catch (err) {
      this.zLog.error({ err });
      throw err;
    }
  }
}