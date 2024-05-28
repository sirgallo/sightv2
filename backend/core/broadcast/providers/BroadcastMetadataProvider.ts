import { LogProvider } from '../../log/LogProvider.js';
import { MemcacheProvider } from '../../redis/providers/MemcacheProvider.js';
import { BroadcastOpts, RoomMetadata } from '../types/Broadcast.js';
import { IUser } from '../../../db/models/User.js';


export class BroadcastMetadataProvider {
	private __memcache: MemcacheProvider;
	private __zLog = new LogProvider(BroadcastMetadataProvider.name);

	constructor(private __opts: BroadcastOpts) {
		this.__memcache = new MemcacheProvider({ db: 'room_cache', ...this.__opts });
	}

  get client() { return this.__memcache.client.duplicate(); }

	async getRoomMeta(roomId: string): Promise<RoomMetadata> {
    return this.__memcache.hgetall(roomId);
  }

  async setRoomMeta({ roomId, orgId, roomRole, roomType, userIds }: { roomId: string } & RoomMetadata) {
    const value = await (async (): Promise<RoomMetadata> => {
      const roomMeta = await this.getRoomMeta(roomId);
      if (! roomMeta) return { roomRole, orgId, roomType, userIds };
      
      const userSet = new Set([ ...userIds, ...roomMeta.userIds  ]);
      return { ...roomMeta, userIds: [ ...userSet  ] };
    })();

    console.log('value:', value);
    await this.__memcache.hset({ key: roomId, value });
    return true;
  }

  async delRoomMeta(roomId: string) {
    return this.__memcache.hdel(roomId);
  }

  async getUserMeta(userId: string): Promise<Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'>> {
    return this.__memcache.hgetall(userId);
  }

  async setUserMeta(opts: { userMeta: Pick<IUser, 'userId' | 'displayName' | 'orgId' | 'role'>, expiration: number }): Promise<boolean> {
    return this.__memcache.hset({ key: opts.userMeta.userId, value: opts.userMeta, expirationInSec: opts.expiration }); // this is set to expire, use this to expire user auth so once logged in user is not always logged in
  }

  async delUser(userId: string) {
    return this.__memcache.hdel(userId);
  }
}