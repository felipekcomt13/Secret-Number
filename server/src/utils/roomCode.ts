import { ROOM_CODE_LENGTH } from 'shared';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I, O to avoid confusion

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
