interface DBConf<NME extends string> {
  name: NME;
  collections: { [key: string]: string };
}

export type DBMap<T extends string> = { [K in T]: DBConf<K>; }