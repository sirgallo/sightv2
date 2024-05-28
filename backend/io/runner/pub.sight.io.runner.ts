import { JWTMiddleware } from '../../core/middleware/JWTMiddleware.js';
import { NodeUtil } from '../../core/utils/Node.js';
import { envLoader } from '../../common/EnvLoader.js';
import { SightMongoProvider } from '../../db/SightProvider.js';
import { RoomType } from '../../core/broadcast/types/Broadcast.js';
import { AuthProvider } from '../../gateway/providers/AuthProvider.js'
import { SightIOConnection } from '../../io/sight.io.connect.js';
import { SightIORunner, sightIORunner } from '../../io/sight.io.runner.js';
import { AuthIOData } from '../../io/data/auth.sight.io.data.js';
import { RoomIOData } from '../../io/data/room.sight.io.data.js';
import { UserRole } from 'db/models/ACL.js';


class PubIORunner extends SightIORunner<boolean> {
  constructor() { super() }

  async runIO(): Promise<boolean> {
    const sightDb = await SightIOConnection.mongo();
    // await this.prepareMockAuthData(sightDb);

    await this.connectAndPublish(sightDb);

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
      await sightDb.user.findOneAndUpdate({ email: user.email }, { $set: { role: user.role, orgId: user.orgId }});
    }
  }

  private async connectAndPublish(sightDb: SightMongoProvider) {
    try {
      const jwtMiddleware = new JWTMiddleware({ 
        secret: envLoader.JWT_SECRET,
        timespanInSec: envLoader.JWT_REFRESH_TIMEOUT 
      });

      const { users } = AuthIOData.data();
      const mockUsers = await sightDb.user.find({ email: { $in: users.map(u => u.email) }});
      if (! mockUsers) throw new Error('no mock users available');

      const rooms: { roomId: string, orgId: string, role: UserRole, roomType: RoomType }[] = [
        { roomId: 'c50dd2a4-f5ad-4cde-b6f1-cb22c67797e4', orgId: mockUsers[0].orgId, role: 'ANALYST', roomType: 'org' },
        { roomId: '72656098-4204-4cb1-be8d-1d1010e0f8ba', orgId: mockUsers[0].orgId, role: 'ARCHITECT', roomType: 'org' },
        { roomId: 'ad48917f-985d-4282-87cb-a7f78a3154f7', orgId: mockUsers[3].orgId, role: 'ADMIN', roomType: 'org' },
        { roomId: '9be6757a-23f0-40ae-9611-ea3582eddf6d', orgId: mockUsers[0].orgId, role: 'ANALYST', roomType: 'user' }
      ];

      const pubber = mockUsers.find(u => u.email === users[1].email)
      const token = await jwtMiddleware.sign(pubber.userId);
      const publisher = SightIOConnection.broadcast(token);
      
      publisher.msg(msg => {
        this.zLog.debug(`msg received: ${msg}`);
      });

      publisher.ready(() => {
        this.zLog.debug('ready');

        const mockData = RoomIOData.data(rooms);
        for (const room of rooms) { 
          publisher.join(room, roomId => {
            for (const msg of mockData[roomId]) {
              publisher.pub(msg);
              this.zLog.debug(`published mock data: ${msg}`)
            }
          });
        };
      });

      publisher.err(err => {
        this.zLog.error(`subscriber err: ${err}`);
      });
    } catch (err) {
      this.zLog.error(`connect io publisher error: ${NodeUtil.extractErrorMessage(err)}`);
      throw err;
    }
  }
}


sightIORunner({ 
  ioRunner: new PubIORunner()
});