import lodash from 'lodash';
const { transform } = lodash;

import { CryptoUtil } from '../../core/utils/Crypto.js';
import { BroadcastRoomConnect, BroadcastRoomData, RoomAccess } from '../../broadcast/types/Broadcast.js';
import { AuthIOData } from './auth.sight.io.data.js';



export class RoomIOData {
  static connect(rooms: { roomId: string, roomType: RoomAccess }[]): BroadcastRoomConnect[] {
    return rooms.map(room => ({ roomId: room.roomId, db: 'room_cache', roomType: room.roomType, token: null }));
  }

  static data(rooms: { roomId: string, roomType: RoomAccess }[]): { [roomId: string]: BroadcastRoomData<MockRoomDataPayload>[] } {
    return transform(rooms, (acc, room) => {
      const analystPayloads: BroadcastRoomData<MockRoomDataPayload>[] = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId, 
          event: 'data',
          role: 'ANALYST',
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha256', format: 'hex' }) as string,
            timestamp: new Date() 
          }
        };
      });

      const architectPayloads: BroadcastRoomData<MockRoomDataPayload>[] = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId, 
          event: 'data',
          role: 'ARCHITECT',
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha256', format: 'hex' }) as string,
            timestamp: new Date() 
          }
        };
      });

      const adminPayloads: BroadcastRoomData<MockRoomDataPayload>[] = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId,
          event: 'data',
          role: 'ADMIN',
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha256', format: 'hex' }) as string,
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