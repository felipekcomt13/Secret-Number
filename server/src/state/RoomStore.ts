import { Room, RoomStatus, MAX_SACRIFICES } from 'shared';
import { generateRoomCode } from '../utils/roomCode';

const ROOM_TTL_MS = 2 * 60 * 60 * 1000;        // 2 hours max for any room
const FINISHED_ROOM_TTL_MS = 15 * 60 * 1000;    // 15 minutes for finished rooms
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;       // run every 5 minutes

class RoomStore {
  private rooms = new Map<string, Room>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  create(adminSocketId: string, range: { min: number; max: number }): Room {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));

    const room: Room = {
      code,
      adminSocketId,
      status: RoomStatus.LOBBY,
      players: new Map(),
      moves: [],
      numberRange: range,
      sacrificesRemaining: MAX_SACRIFICES,
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  findByAdminSocket(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.adminSocketId === socketId) return room;
    }
    return undefined;
  }

  findByPlayerSocket(socketId: string): { room: Room; playerId: string } | undefined {
    for (const room of this.rooms.values()) {
      for (const [id, player] of room.players) {
        if (player.socketId === socketId) return { room, playerId: id };
      }
    }
    return undefined;
  }
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    for (const [code, room] of this.rooms) {
      const age = now - room.createdAt;
      const isFinished = room.status === RoomStatus.FINISHED;
      if (age > ROOM_TTL_MS || (isFinished && age > FINISHED_ROOM_TTL_MS)) {
        this.rooms.delete(code);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`[RoomStore] Cleaned up ${removed} stale room(s). Active: ${this.rooms.size}`);
    }
    return removed;
  }

  startCleanupInterval(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }
}

export const roomStore = new RoomStore();
roomStore.startCleanupInterval();
