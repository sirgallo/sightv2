import lodash from 'lodash';
const { transform } = lodash;

import { CryptoUtil } from '../../core/utils/Crypto.js';
import { BroadcastRoomConnect, BroadcastRoomData, RoomAccess } from '../../broadcast/types/Broadcast.js';
import { AuthIOData } from './auth.sight.io.data.js';



export class RoomIOData {
  static rooms(): { roomId: string, roomType: RoomAccess }[] {
    const orgs = AuthIOData.orgs();
    const users = AuthIOData.users();
    
    return [
      { roomId: orgs[0].orgId, roomType: 'org' },
      { roomId: orgs[1].orgId, roomType: 'org' },
      { roomId: users[0].userId, roomType: 'user' },
      { roomId: users[1].userId, roomType: 'user' },
      { roomId: users[2].userId, roomType: 'user' },
    ]
  }

  static connect(): BroadcastRoomConnect[] {
    return RoomIOData.rooms().map(room => ({ roomId: room.roomId, db: 'io_broadcast', roomType: room.roomType, token: null }));
  }

  static data(): { [roomId: string]: BroadcastRoomData<MockRoomDataPayload>[] } {
    return transform(RoomIOData.rooms(), (acc, room) => {
      const analystPayloads: BroadcastRoomData<MockRoomDataPayload>[] = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId, 
          event: 'DATA',
          role: 'ANALYST',
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha128', format: 'hex' }) as string,
            timestamp: new Date() 
          }
        };
      });

      const architectPayloads: BroadcastRoomData<MockRoomDataPayload>[] = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId, 
          event: 'DATA',
          role: 'ARCHITECT',
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha128', format: 'hex' }) as string,
            timestamp: new Date() 
          }
        };
      });

      const adminPayloads: BroadcastRoomData<MockRoomDataPayload>[] = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId,
          event: 'DATA',
          role: 'ADMIN',
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha128', format: 'hex' }) as string,
            timestamp: new Date() 
          }
        };
      })

      acc[room.roomId] = [ ...analystPayloads, ...architectPayloads, ...adminPayloads ];
      return acc;
    }, {} as { [roomId: string]: BroadcastRoomData<MockRoomDataPayload>[] });
  }
}


export interface MockRoomDataPayload {
  message: string;
  timestamp: Date;
}


const ROOM_PAYLOAD_DATA_LENGTH = 25;