import { JWTMiddleware } from '../../core/middleware/JWTMiddleware.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { envLoader } from '../../common/EnvLoader.js';
import { SightMongoProvider } from '../../db/SightProvider.js';
import { PublisherProvider } from '../../broadcast/providers/PublisherProvider.js';
import { BroadcastRoomConnect } from '../../broadcast/types/Broadcast.js';
import { AuthProvider } from '../../gateway/providers/AuthProvider.js'
import { SightIOConnection } from '../../io/sight.io.connect.js';
import { SightIORunner, sightIORunner } from '../../io/sight.io.runner.js';
import { AuthIOData } from '../../io/data/auth.sight.io.data.js';
import { RoomIOData } from '../../io/data/room.sight.io.data.js';


class PubIORunner extends SightIORunner<boolean> {
  constructor() { super() }

  async runIO(): Promise<boolean> {
    const sightDb = await SightIOConnection.mongo();
    await this.prepareMockAuthData(sightDb);

    const publisher = SightIOConnection.publisher();
    await this.connectAndPublish(publisher, sightDb);

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
      await sightDb.user.findOneAndDelete({ userId: user.userId });
      await new AuthProvider(sightDb).register(user);
    }
  }

  private async connectAndPublish(publisher: PublisherProvider, sightDb: SightMongoProvider) {
    try {
      const jwtMiddleware = new JWTMiddleware({ 
        secret: envLoader.JWT_SECRET,
        timespanInSec: envLoader.JWT_REFRESH_TIMEOUT 
      });

      const { users } = AuthIOData.data();

      const mockConnectOpts = RoomIOData.connect();
      const user0 = await sightDb.user.findOne({ userId: users[0].userId });
      const token = await jwtMiddleware.sign(user0.userId);
      const validatedConnectOpts = mockConnectOpts
        .map(opt => ({ roomId: opt.roomId, roomType: opt.roomType, token }))
        .filter(room => room.roomType === 'org' || room.roomId === user0.userId);

      try {
        for (const opt of validatedConnectOpts) { 
          publisher.listen(opt)
        };
      } catch (err) {
        this.zLog.error(`listening on publisher error: ${NodeUtil.extractErrorMessage(err)}`);
        throw err;
      }

      this.__publish(publisher, validatedConnectOpts);
    } catch (err) {
      this.zLog.error(`connect io publisher error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  private async __publish(
    publisher: PublisherProvider,
    validatedConnectOpts: Pick<BroadcastRoomConnect, 'roomId' | 'roomType' | 'token'>[]
  ) {
    try {
      const mockData = RoomIOData.data();
      for (const opt of validatedConnectOpts) {
        for (const msg of mockData[opt.roomId]) {
          publisher.publish(msg);
          this.zLog.debug(`published mock data: ${msg}`)
        }
      }

      this.zLog.debug(`finished published mock data`);
    } catch (err) {
      console.error('failed to insert mock data:', err);
      throw err;
    }
  }
}


sightIORunner({ 
  ioRunner: new PubIORunner()
});