import { JWTMiddleware } from '../../core/middleware/JWTMiddleware.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { envLoader } from '../../common/EnvLoader.js';
import { SightMongoProvider } from '../../db/SightProvider.js';
import { SubscriberProvider } from '../../broadcast/providers/SubscriberProvider.js';
import { BroadcastRoomData } from '../../broadcast/types/Broadcast.js';
import { AuthProvider } from '../../gateway/providers/AuthProvider.js'
import { SightIOConnect } from '../../io/sight.io.connect.js';
import { SightIORunner, sightIORunner } from '../../io/sight.io.runner.js';
import { AuthIOData } from '../../io/data/auth.sight.io.data.js';
import { MockRoomDataPayload, RoomIOData } from '../../io/data/room.sight.io.data.js';


class SubIORunner extends SightIORunner<boolean> {
  constructor() { super() }

  async runIO(): Promise<boolean> {
    const sightDb = SightIOConnect.getMongo();
    await sightDb.createNewConnection();
    await this.prepareMockAuthData(sightDb);

    const subscriber = SightIOConnect.getSubscriber('DATA');
    await this.connectAndSubscribe(subscriber, sightDb);

    return true;
  }

  private async prepareMockAuthData(sightDb: SightMongoProvider) {
    for (const org of AuthIOData.orgs()) {
      await sightDb.org.findOneAndReplace({ orgId: org.orgId }, org, { new: true });
    }

    for (const acl of AuthIOData.acls()) {
      await sightDb.acl.findOneAndReplace({ aclId: acl.aclId }, acl, { new: true });
    }

    for (const user of AuthIOData.users()) {
      await sightDb.user.findOneAndDelete({ userId: user.userId });
      await new AuthProvider(sightDb).register(user);
    }
  }

  private async connectAndSubscribe(
    subscriber: SubscriberProvider<BroadcastRoomData<MockRoomDataPayload>>,
    sightDb: SightMongoProvider
  ) {
    try {
      const jwtMiddleware = new JWTMiddleware({ 
        secret: envLoader.JWT_SECRET,
        timespanInSec: envLoader.JWT_REFRESH_TIMEOUT 
      });

      const mockConnectOpts = RoomIOData.connect();
      const user0 = await sightDb.user.findOne({ userId: AuthIOData.users()[0].userId });
      const token = await jwtMiddleware.sign(user0.userId);
      const validatedConnectOpts = mockConnectOpts
        .map(opt => ({ roomId: opt.roomId, roomType: opt.roomType, token }))
        .filter(room => room.roomType === 'org' || room.roomId === user0.userId);

      new Promise(() => {
        try {
          for (const opt of validatedConnectOpts) { 
            subscriber.listen(opt); 
            this.zLog.debug(`listening on publisher for opt: ${opt}`);
          };
        } catch (err) {
          this.zLog.error(`listening on publisher error: ${NodeUtil.extractErrorMessage(err)}`);
          throw err;
        }
      })

      await this.__subscribe(subscriber);
    } catch (err) {
      this.zLog.error(`connect io publisher error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }

  private async __subscribe(subscriber: SubscriberProvider<BroadcastRoomData<MockRoomDataPayload>>) {
    try {
      subscriber.on(msg => {
        this.zLog.debug(`msg received: ${msg}`);
      });
    } catch (err) {
      console.error('failed to insert mock data:', err);
      throw err;
    }
  }
}


sightIORunner({ 
  ioRunner: new SubIORunner()
});