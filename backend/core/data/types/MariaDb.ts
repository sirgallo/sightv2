import { QueryResult, FieldPacket } from 'mysql2/promise';


export type MariaDbOperation = 'query' | 'insert' | 'delete' | 'close';

export interface MariaDbQueryResponse {
  rows: QueryResult;
  fields: FieldPacket[];
}