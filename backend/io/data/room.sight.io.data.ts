import lodash from 'lodash';
const { transform } = lodash;

import { CryptoUtil } from '../../core/utils/Crypto.js';
import { RoomType } from '../../broadcast/types/Broadcast.js';



export class RoomIOData {
  static data(rooms: { roomId: string, roomType: RoomType }[]) {
    return transform(rooms, (acc, room) => {
      const analystPayloads = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId,
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha256', format: 'hex' }) as string,
            timestamp: new Date() 
          }
        };
      });

      const architectPayloads = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId,
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha256', format: 'hex' }) as string,
            timestamp: new Date() 
          }
        };
      });

      const adminPayloads = Array(ROOM_PAYLOAD_DATA_LENGTH).fill(0).map((_, idx) => {
        return { 
          roomId: room.roomId,
          payload: { 
            message: CryptoUtil.generateHash({ data: idx.toString(), algorithm: 'sha256', format: 'hex' }) as string,
            timestamp: new Date() 
          }
        };
      })

      acc[room.roomId] = [ ...analystPayloads, ...architectPayloads, ...adminPayloads ];
      return acc;
    }, {});
  }
}


export interface MockRoomDataPayload {
  message: string;
  timestamp: Date;
}


const ROOM_PAYLOAD_DATA_LENGTH = 25;