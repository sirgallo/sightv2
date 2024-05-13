import { CryptoUtil } from 'core/utils/Crypto.js';
import { BroadcastRoomConnect, BroadcastRoomData } from '../../broadcast/types/Broadcast.js';


const roomId = CryptoUtil.generateSecureUUID();

export const mockConnectPayloads: BroadcastRoomConnect[] = [
  { roomId, }
]

export class MockSubData {
  static connect(): BroadcastRoomConnect[] => {
    
  }
}