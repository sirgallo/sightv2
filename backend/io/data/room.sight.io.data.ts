import lodash from 'lodash';
const { transform } = lodash;

import { CryptoUtil } from '../../core/utils/Crypto.js';
import { BroadcastRoomMessage, RoomType } from '../../broadcast/types/Broadcast.js';
import { AuthIOData } from './auth.sight.io.data.js';



export class RoomIOData {
  static connect(
    rooms: { roomId: string, roomType: RoomType }[]
  ): Pick<BroadcastRoomMessage, 'roomId' | 'orgId' | 'role' | 'roomType'>[] {
    return rooms.map(room => ({ roomId: room.roomId, db: 'room_cache', roomType: room.roomType, token: null }));
  }

  static data(rooms: { roomId: string, roomType: RoomType }[]): { [roomId: string]: BroadcastRoomMessage<MockRoomDataPayload>[] } {
    return transform(rooms, (acc, room) => {
      const analystPayloads: BroadcastRoomMessage<MockRoomDataPayload>[] = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId, 
          roomType: room.roomType,
          event: 'data',
          role: 'ANALYST',
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha256', format: 'hex' }) as string,
            timestamp: new Date() 
          }
        };
      });

      const architectPayloads: BroadcastRoomMessage<MockRoomDataPayload>[] = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId,
          roomType: room.roomType,
          event: 'data',
          role: 'ARCHITECT',
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha256', format: 'hex' }) as string,
            timestamp: new Date() 
          }
        };
      });

      const adminPayloads: BroadcastRoomMessage<MockRoomDataPayload>[] = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId,
          roomType: room.roomType,
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
    }, {} as { [roomId: string]: BroadcastRoomMessage<MockRoomDataPayload>[] });
  }
}


export interface MockRoomDataPayload {
  message: string;
  timestamp: Date;
}


const ROOM_PAYLOAD_DATA_LENGTH = 25;