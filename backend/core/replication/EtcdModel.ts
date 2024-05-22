export type Etcd3PrefixedKey<K extends string, PRF = unknown> = 
  PRF extends string ? `${PRF}/${K}` : K;

interface __baseEtcModel<V, K extends string, PRF = unknown> { 
  KeyType: Etcd3PrefixedKey<K, PRF>
  ValueType: V;
}

export type EtcdModel<V, K extends string, PRF = unknown> =
  PRF extends string ? __baseEtcModel<V, K, PRF> & { Prefix: PRF } : __baseEtcModel<V, K, PRF>;


export class ValueSerializer {
  static serialize = <V, K extends string, PRF = unknown>(value: EtcdModel<V, K, PRF>['ValueType']): Buffer => {
    if (typeof value === 'object') return Buffer.from(JSON.stringify(value));
    if (typeof value === 'string') return Buffer.from(value);
    if (typeof value === 'number') return Buffer.from(value.toString());
    if (typeof value === 'boolean') return Buffer.from(value === true ? [0x01] : [0x00]);
    if (Buffer.isBuffer(value)) return value;

    throw new Error('input value to be serialized is of unknown or undefined type');
  };

  static deserialize = <V, K extends string, PRF = unknown>(encoded: Buffer): EtcdModel<V, K, PRF>['ValueType'] => {
    const decoded = encoded.toString('utf8');
    try {
      return JSON.parse(decoded);
    } catch (__err) { return decoded as V; }
  };
}