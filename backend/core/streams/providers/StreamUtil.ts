export class StreamUtil {
  static parseNestedJSON = (str: string) => {
    try {
      return JSON.parse(str, (_, val) => {
        if (typeof val === 'string') return StreamUtil.parseNestedJSON(val);
        return val;
      });
    } catch (err) { return str; }
  };

  static stringifyIfNeeded = <T>(message: T): string => {
    try {
      if (typeof(message) !== 'string') {
        if (typeof(message) === 'number' || typeof(message) === 'boolean') return message.toString();
        if (typeof(message) === 'object') {
          const parsed = JSON.stringify(message);
          if (parsed !== '{}') return parsed;
        }
      }
  
      return message as string;
    } catch (e) { 
      return message as string;
    }
  };

  static spreadObjectFields = <T>(val: T): string[] => {
    if (typeof(val) === 'object') {
      return Object.entries(val).reduce((acc: string[], curr: [string, any]) => {
        const [ key, val ] = curr;
        acc.push(...[ key, StreamUtil.stringifyIfNeeded(val[key]) ]);
        return acc;
      }, []);
    } else { return [ 'message', StreamUtil.stringifyIfNeeded(val) ]; } // this is a default if incoming message is a string, will set a default field
  };

  static parsePrefixedKey = (prefix: string, key: string): `${string}-${string}` => `${prefix}-${key}`;
  static parseLastAcknowledgedKey = (consumerGroup: string) => `last_acknowledged:${consumerGroup}`;
}