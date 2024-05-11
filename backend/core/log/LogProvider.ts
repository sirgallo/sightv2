import { BASE, ERROR, WARN, INFO, DEBUG } from './Log.js';


export class LogProvider {
  private log = console.log;
  private table = console.table;
  constructor(private baseName: string) {}

  debug = <T extends any>(message: T) => this.log(BASE(this.formatBaseName()), DEBUG(message));
  info = <T extends any>(message: T) => this.log(BASE(this.formatBaseName()), INFO(message));
  warn = <T extends any>(message: T) => this.log(BASE(this.formatBaseName()), WARN(message));
  error = <T extends any>(message: T) => this.log(BASE(this.formatBaseName()), ERROR(message));
  logTable = <T extends any>(data: T, fields?: string[]) => this.table(data, fields);
  json<T>(json: T) {
    const stringifiedJson = Object
      .keys(json)
      .map(key => [ INFO(`{ ${key}: ${BASE(json[key])} }`) ])
      .join('');

    this.log(stringifiedJson);
  }

  private formatBaseName = (): string => `[${this.baseName.toUpperCase()}]: `;
}