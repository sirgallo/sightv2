import { JWTMiddleware } from '../../core/middleware/JWTMiddleware.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { envLoader } from '../../common/EnvLoader.js';
import { SightMongoProvider } from '../../db/SightProvider.js';
import { RoomType } from '../../broadcast/types/Broadcast.js';
import { AuthProvider } from '../../gateway/providers/AuthProvider.js'
import { SightIOConnection } from '../../io/sight.io.connect.js';
import { SightIORunner } from '../../io/sight.io.runner.js';
import { AuthIOData } from '../../io/data/auth.sight.io.data.js';
import { RoomIOData } from '../../io/data/room.sight.io.data.js';
import { UserRole } from 'db/models/ACL.js';


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

      const rooms: { roomId: string, orgId: string, role: UserRole, roomType: RoomType }[] = [
        { roomId: '5d214fc5-f36c-4fbf-bd96-c9d12878b1c6', orgId: mockUsers[0].orgId, role: mockUsers[0].role, roomType: 'org' },
        { roomId: '8759c7b6-449b-42be-95d6-477b89a2c452', orgId: mockUsers[1].orgId, role: mockUsers[1].role, roomType: 'org' },
        { roomId: 'f117fd99-d8bd-4c00-babd-f64ed8a35009', orgId: mockUsers[2].orgId, role: mockUsers[1].role, roomType: 'org' },
        { roomId: '8885a0d2-47e0-4601-8169-35cb143cf9f7', orgId: mockUsers[0].orgId, role: mockUsers[0].role, roomType: 'user' }
      ];

      const token = await jwtMiddleware.sign(mockUsers[0].userId);
      const subscriber = SightIOConnection.broadcast(token);

      subscriber.ready(() => {
        this.zLog.debug('ready');

        subscriber.sub((msg, ack) => {
          this.zLog.debug(`msg received: ${msg}`);
          ack('ok');
        });

        for (const room of rooms) { 
          subscriber.join(room);
        };
      });

      subscriber.on('error', err => {
        this.zLog.error(`subscriber err: ${err}`);
      });
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