import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from 'shared';
import { roomStore } from '../state/RoomStore';
import { getPublicPlayers, getAdminPlayers } from '../state/GameEngine';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Grace period timers for admin disconnections
const adminDisconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
const ADMIN_GRACE_PERIOD_MS = 60_000; // 1 minute

export function registerConnectionHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('player:reconnect', (data, callback) => {
    const room = roomStore.get(data.code);
    if (!room) return callback({ ok: false, error: 'Sala no encontrada' });

    const player = room.players.get(data.playerId);
    if (!player) return callback({ ok: false, error: 'Jugador no encontrado' });

    // Update socket id and mark as connected
    player.socketId = socket.id;
    player.connected = true;
    socket.join(room.code);

    io.to(room.code).emit('room:player-reconnected', { playerId: data.playerId });

    callback({
      ok: true,
      players: getPublicPlayers(room),
      moves: room.moves,
      guesses: player.guesses,
      submitted: player.submitted,
      betSubmitted: player.bet !== null,
      sacrificesRemaining: room.sacrificesRemaining,
      status: room.status,
    });
  });

  socket.on('admin:reconnect', (data, callback) => {
    const room = roomStore.get(data.code);
    if (!room) return callback({ ok: false, error: 'Sala no encontrada' });

    // Cancel any pending destruction timer
    const timer = adminDisconnectTimers.get(room.code);
    if (timer) {
      clearTimeout(timer);
      adminDisconnectTimers.delete(room.code);
    }

    // Update admin socket id
    room.adminSocketId = socket.id;
    socket.join(room.code);

    callback({
      ok: true,
      players: getAdminPlayers(room),
      moves: room.moves,
      sacrificesRemaining: room.sacrificesRemaining,
      status: room.status,
    });
  });

  socket.on('disconnect', () => {
    // Check if disconnecting socket is an admin
    const adminRoom = roomStore.findByAdminSocket(socket.id);
    if (adminRoom) {
      // Start grace period instead of immediate destruction
      const timer = setTimeout(() => {
        adminDisconnectTimers.delete(adminRoom.code);
        const room = roomStore.get(adminRoom.code);
        if (room && room.adminSocketId === socket.id) {
          io.to(room.code).emit('room:closed', { reason: 'El administrador se ha desconectado' });
          io.in(room.code).socketsLeave(room.code);
          roomStore.delete(room.code);
        }
      }, ADMIN_GRACE_PERIOD_MS);
      adminDisconnectTimers.set(adminRoom.code, timer);
      return;
    }

    // Check if disconnecting socket is a player
    const found = roomStore.findByPlayerSocket(socket.id);
    if (found) {
      const { room, playerId } = found;
      const player = room.players.get(playerId);
      if (player) {
        player.connected = false;
        io.to(room.code).emit('room:player-disconnected', { playerId });
      }
    }
  });
}
