import { hostname } from 'os';
import EventEmitter from 'events';

import { ApplicableSystem } from '../../ServerConfigurations.js';
import { LogProvider } from '../../core/log/LogProvider.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { Connection } from '../../common/Connection.js';
import { envLoader } from '../../common/EnvLoader.js';
import { ElectionEvent, ElectionListener, GetAllResponse } from './Etcd.js';


export class ReplicationProvider extends EventEmitter {
  private __hostname = hostname();
  private __leader: string;
  private __zLog = new LogProvider(ReplicationProvider.name);
  
  constructor(private __system: ApplicableSystem, private __etcdProvider = Connection.etcd()) {
    super();
  }

  get hostname() { return this.__hostname; }
  get leader() { return this.__leader; }
  get system() { return this.__system; }

  on = (event: ElectionEvent, listener: ElectionListener) => super.on(event, listener);

  async campaign() {
    try {
      await this.__register();
      this.__watch();
    } catch (err) {
      this.__zLog.error(`campaign error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  private async __register() {
    this.__leader = this.__hostname;
    this.__etcdProvider.put<string, string, ApplicableSystem>({
      key: `${this.__system}/${this.__hostname}`,
      value: this.__hostname
    });

    this.__zLog.info(`registered host in etcd, creating lease with time of: ${envLoader.SIGHT_ETCD_ELECTION_TIMEOUT}ms`);
    await this.__etcdProvider.createLease<string, string, ApplicableSystem>(
      `${this.__system}/${this.__hostname}`,
      { ttl: envLoader.SIGHT_ETCD_ELECTION_TIMEOUT }
    );
  }

  private async __watch() {
    const watcher = await this.__etcdProvider.startWatcher({ prefix: this.__system });
    this.__etcdProvider.onWatch('put', async resp => {
      try {
        const potentialLeader = resp.value.toString();
        const leader = await this.__determineCurrentLeader(potentialLeader);
        this.__zLog.debug(`watch on put, leader put: ${leader}`);
        if (leader !== this.__leader) this.__emitElectionEvent('elected', leader);
        else await this.__set({ address: this.__hostname, leader: this.__leader });
      } catch (err) {
        this.__zLog.error(`error on put response for address keys: ${NodeUtil.extractErrorMessage(err)}`);
        await watcher.cancel();
        throw err;
      }
    });

    this.__etcdProvider.onWatch('delete', async () => {
      try {
        const leader = await this.__determineCurrentLeader();
        if (leader !== this.__leader) this.__emitElectionEvent('elected', leader);
        else await this.__set({ address: this.__hostname, leader: this.__leader });
      } catch (err) {
        this.__zLog.error(`error on delete response for address keys: ${NodeUtil.extractErrorMessage(err)}`);
        await watcher.cancel();
        throw err;
      }
    });
  }

  private async __determineCurrentLeader(potential?: string): Promise<string> {
    const quorum = (systems: number) => (systems / 2) + 1;
    const voteCounts: { [system: string]: number } = {};

    const addresses = await this.__getAll();
    const votes = Object.entries(addresses);
    const requiredQuorum = quorum(votes.length);

    let currentLeader: string;
    for (const [ _, vote ] of votes) {
      if (addresses[vote]) {
        if (! voteCounts[vote]) voteCounts[vote] = 0;
        voteCounts[vote]++;
  
        if (
          voteCounts[vote] >= requiredQuorum
          && (! currentLeader || voteCounts[vote] > voteCounts[currentLeader])
        ) { currentLeader = vote; }
      }
    }

    if (currentLeader) return currentLeader;

    const vote = potential ?? this.__hostname;
    await this.__set({ address: this.__hostname, leader: vote });
    return vote;
  }

  private async __heartbeat() {
    try {
      while (this.__leader === this.__hostname) {
        await this.__set({ address: this.__hostname, leader: this.__hostname });
        await NodeUtil.sleep(envLoader.SIGHT_ETCD_HEARTBEAT_TIMEOUT);
      }
    } catch(err) {
      this.__zLog.error(`heartbeat services error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  private async __set(opts: { address: string, leader: string }) {
    await this.__etcdProvider.put<string, string, ApplicableSystem>({ key: `${this.__system}/${opts.address}`, value: opts.leader });
  }

  private async __get(opts: { address: string }): Promise<string> {
    return this.__etcdProvider.get<string, string, ApplicableSystem>(`${this.__system}/${opts.address}`);
  }

  private async __getAll(): Promise<GetAllResponse<string, string, ApplicableSystem>> {
    return this.__etcdProvider.getAll<'iterate', string, string, ApplicableSystem>({ prefix: this.__system });
  }

  private __emitElectionEvent = (event: ElectionEvent, elected: string) => {
    this.__leader = elected;
    this.__zLog.info(`new leader discovered: ${this.__leader}`);

    super.emit(event, elected);
    if (elected === this.__hostname) this.__heartbeat();
  }
}