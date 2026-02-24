import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from 'shared';
import { roomStore } from '../state/RoomStore';
import { getPublicPlayers } from '../state/GameEngine';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

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
    });
  });

  socket.on('disconnect', () => {
    // Check if disconnecting socket is an admin
    const adminRoom = roomStore.findByAdminSocket(socket.id);
    if (adminRoom) {
      io.to(adminRoom.code).emit('room:closed', { reason: 'El administrador se ha desconectado' });
      io.in(adminRoom.code).socketsLeave(adminRoom.code);
      roomStore.delete(adminRoom.code);
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
