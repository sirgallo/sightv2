import { EventEmitter } from 'events';
import { hostname } from 'os';
import { Etcd3, Lease, ILeaseKeepAliveResponse, IOptions, Watcher, MultiRangeBuilder, Range } from 'etcd3';
import lodash from 'lodash';
const { transform } = lodash; 

import { LogProvider } from '../log/LogProvider.js';
import { NodeUtil } from '../utils/Node.js';
import { envLoader } from '../../common/EnvLoader.js';
import { EtcdModel, ValueSerializer } from './EtcdModel.js';
import { 
  WatchEvent, WatchListener, InitWatchOpts, WatchEventData, CreateLeaseOptions, GetAllResponse,
  WATCH_EVENTS, ETCDDataProcessingOpts,
  ElectionEvent,
  ElectionListener,
  ELECTION_EVENTS
} from './Etcd.js';


export class ETCDProvider extends EventEmitter {
  private __hostname = hostname();
  private __client: Etcd3;
  private __zLog = new LogProvider(ETCDProvider.name);

  constructor(private __opts: IOptions) { 
    super();
    this.__client = new Etcd3(this.__opts);
  }

  get hostname() { return this.__hostname; }

  onElection = (event: ElectionEvent, listener: ElectionListener) => super.on(event, listener);

  onWatch<EVT extends WatchEvent>(event: EVT, listener: WatchListener<EVT>) {
    return super.on(event, listener);
  }

  async startElection(electionName: string) {
    const election = this.__client.election(electionName);

    const createCampaign = async () => {
      try {
        const campaign = election.campaign(this.hostname);
        this.__zLog.info(`campaign started for host: ${this.hostname}`);
  
        campaign.on('elected', () => {
          this.__zLog.info('I am the new leader');
          this.__emitElectionEvent(ELECTION_EVENTS.elected, true);
        });
  
        campaign.on('error', err => {
          this.__zLog.error(`campaign error: ${NodeUtil.extractErrorMessage(err)}`);
          setTimeout(() => createCampaign(), envLoader.SIGHT_ETCD_ELECTION_TIMEOUT);
        });
      } catch (err) {
        this.__zLog.error(`campaign initialization error: ${NodeUtil.extractErrorMessage(err)}`);
        setTimeout(() => createCampaign(), envLoader.SIGHT_ETCD_ELECTION_TIMEOUT);
      }
    };

    const createObserver = async () => {
      try {
        const observer = await election.observe();
        this.__zLog.info('leader observer started');

        observer.on('change', leader => {
          if (leader !== this.hostname) { 
            this.__zLog.info(`the new leader is: ${leader}`);
            this.__emitElectionEvent(ELECTION_EVENTS.elected, false);
          }
        });

        observer.on('error', err => {
          this.__zLog.error(`observer error: ${NodeUtil.extractErrorMessage(err)}`);
          setTimeout(() => createObserver(), envLoader.SIGHT_ETCD_ELECTION_TIMEOUT);
        });
      } catch (err) {
        this.__zLog.error(`observer initialization error: ${NodeUtil.extractErrorMessage(err)}`);
        setTimeout(() => createObserver(), envLoader.SIGHT_ETCD_ELECTION_TIMEOUT);
      }
    };

    try {
      Promise.all([ createCampaign(), createObserver() ]);
    } catch (err) {
      this.__zLog.error(`election error: ${NodeUtil.extractErrorMessage(err)}`)
    }
  }

  async startWatcher<EVT extends 'key' | 'prefix', K extends string, PRF = unknown>(opts: InitWatchOpts<EVT, K, PRF>): Promise<Watcher> {
    const watcher = await (async (): Promise<Watcher> => {
      if ('prefix' in opts) return this.__client.watch().prefix(opts.prefix).create();
      return this.__client.watch().key(opts.key).create();
    })();

    watcher.on('connected', () => this.__zLog.info('watcher successfully connected'));
    watcher.on('disconnected', () => this.__zLog.info('watcher disconnected'));
    watcher.on('error', err => this.__zLog.error(`error on watcher: ${err.message}`));

    watcher.on('data', data => this.__emitMutatedKeyEvent(WATCH_EVENTS.data, data));
    watcher.on('delete', res => this.__emitMutatedKeyEvent(WATCH_EVENTS.delete, res));
    watcher.on('put', res => this.__emitMutatedKeyEvent(WATCH_EVENTS.put, res));

    return watcher;
  }

  async startWatcherForLease<K extends string, PRF = unknown>(watchOpts: InitWatchOpts<'key', K, PRF>, leaseOpts: CreateLeaseOptions): Promise<Watcher> {
    await this.createLease(watchOpts.key, leaseOpts);
    return this.startWatcher(watchOpts);
  }

  async put<V, K extends string, PRF = unknown>(opts: { key: EtcdModel<V, K, PRF>['KeyType'], value: EtcdModel<V, K, PRF>['ValueType'] }): Promise<boolean> {
    await this.__client.put(opts.key).value(ValueSerializer.serialize<V, K, PRF>(opts.value));
    return true;
  }

  async get<V, K extends string, PRF = unknown>(key: EtcdModel<V, K, PRF>['KeyType']): Promise<EtcdModel<V, K, PRF>['ValueType']> {
    const buff = await this.__client.get(key).buffer();
    return ValueSerializer.deserialize<V, K, PRF>(buff);
  }

  async delete<V, K extends string, PRF = unknown>(key: EtcdModel<V, K, PRF>['KeyType']): Promise<boolean> {
    await this.__client.delete().key(key);
    return true;
  }

  async getAll<T extends 'iterate' | 'range', V, K extends string, PRF = unknown>(opts: ETCDDataProcessingOpts<V, K, PRF, T>): Promise<GetAllResponse<V, K, PRF>> {
    const pipeline = ((): MultiRangeBuilder => {
      let builder = this.__client.getAll();
      
      if ('prefix' in opts) builder = builder.prefix(opts.prefix);
      if ('range' in opts) { 
        const range = new Range(opts.range.start, opts.range.end);
        builder = builder.inRange(range);
      }

      if ('sort' in opts) builder = builder.sort(opts.sort.on, opts.sort.direction)
      if ('limit' in opts) builder = builder.limit(opts.limit);

      return builder;
    })();

    const resp: { [key: string]: Buffer } = await pipeline.buffers();
    return transform(
      resp,
      (acc, serialized, key) => {
        const value = ValueSerializer.deserialize(serialized);
        acc[key] = value;
      },
      {} as GetAllResponse<V, K, PRF>
    );
  }

  async createLease<V, K extends string, PRF = unknown>(existingKey: EtcdModel<V, K, PRF>['KeyType'], opts: CreateLeaseOptions): Promise<Lease> {
    const lease = this.__client.lease(opts.ttl, opts.opts);
    await lease.put(existingKey).exec();
    return lease;
  }

  async renewLeaseOnce(lease: Lease): Promise<ILeaseKeepAliveResponse> {
    return lease.keepaliveOnce();
  }

  async revokeLease(lease: Lease): Promise<boolean> {
    await lease.revoke();
    return true;
  }

  async closeConnection() {
    this.__client.close();
  }

  private __emitElectionEvent = (event: ElectionEvent, elected: boolean) => super.emit(event, elected);

  private __emitMutatedKeyEvent = (event: WatchEvent, data: WatchEventData<typeof event>) => super.emit(event, data);
}