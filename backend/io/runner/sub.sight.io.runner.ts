import { JWTMiddleware } from '../../core/middleware/JWTMiddleware.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { envLoader } from '../../common/EnvLoader.js';
import { SightMongoProvider } from '../../db/SightProvider.js';
import { SubscriberProvider } from '../../broadcast/providers/SubscriberProvider.js';
import { BroadcastRoomData, RoomAccess } from '../../broadcast/types/Broadcast.js';
import { AuthProvider } from '../../gateway/providers/AuthProvider.js'
import { SightIOConnection } from '../../io/sight.io.connect.js';
import { SightIORunner, sightIORunner } from '../../io/sight.io.runner.js';
import { AuthIOData } from '../../io/data/auth.sight.io.data.js';
import { MockRoomDataPayload, RoomIOData } from '../../io/data/room.sight.io.data.js';


class SubIORunner extends SightIORunner<boolean> {
  constructor() { super() }

  async runIO(): Promise<boolean> {
    const sightDb = await SightIOConnection.mongo();
    await this.prepareMockAuthData(sightDb);

    await this.connectAndSubscribe(sightDb);
    return true;
  }

  private async prepareMockAuthData(sightDb: SightMongoProvider) {
    const { orgs, users, acls } = AuthIOData.data();

    for (const org of orgs) {
      await sightDb.org.findOneAndReplace({ orgId: org.orgId }, org, { new: true });
    }

    for (const acl of acls) {
      await sightDb.acl.findOneAndReplace({ aclId: acl.aclId }, acl, { new: true });
    }

    for (const user of users) {
      await sightDb.user.findOneAndDelete({ email: user.email });
      await new AuthProvider(sightDb).register(user);
    }
  }

  private async connectAndSubscribe(sightDb: SightMongoProvider) {
    try {
      const jwtMiddleware = new JWTMiddleware({ 
        secret: envLoader.JWT_SECRET,
        timespanInSec: envLoader.JWT_REFRESH_TIMEOUT 
      });

      const { users, orgs } = AuthIOData.data();
      const mockUsers = await sightDb.user.find({ email: { $in: users.map(u => u.email) }});
      if (! mockUsers) throw new Error('no mock users available');

      const rooms: { roomId: string, roomType: RoomAccess }[] = [
        { roomId: orgs[0].orgId, roomType: 'org' },
        { roomId: orgs[1].orgId, roomType: 'org' },
        { roomId: mockUsers[0].userId, roomType: 'user' },
        { roomId: mockUsers[1].userId, roomType: 'user' },
        { roomId: mockUsers[2].userId, roomType: 'user' },
      ];

      const mockConnectOpts = RoomIOData.connect(rooms);
      console.log('users', mockUsers)
      const token = await jwtMiddleware.sign(mockUsers[0].userId);
      const subscriber = SightIOConnection.subscriber(token, 'data');

      subscriber.on('joined', () => {
        this.zLog.debug('successfully joined room');
      });

      subscriber.on('data', msg => {
        this.zLog.debug(`msg received: ${msg}`);
      });

      const validatedConnectOpts = mockConnectOpts
        .map(opt => ({ roomId: opt.roomId, roomType: opt.roomType, token }))
        .filter(room => room.roomType === 'org' || room.roomId === mockUsers[0].userId);

      try {
        for (const opt of validatedConnectOpts) { 
          subscriber.join(opt);
        };
      } catch (err) {
        this.zLog.error(`listening on subscriber error: ${NodeUtil.extractErrorMessage(err)}`);
        throw err;
      }
    } catch (err) {
      this.zLog.error(`connect io subscriber error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }
}

/*
sightIORunner({ 
  ioRunner: new SubIORunner()
});
*/

new SubIORunner().runIO();