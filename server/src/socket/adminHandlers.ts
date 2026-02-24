import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, DEFAULT_NUMBER_RANGE, RoomStatus, Operation } from 'shared';
import { roomStore } from '../state/RoomStore';
import { assignSecretNumbers, executeOperation, calculateScores, getPublicPlayers, getAdminPlayers } from '../state/GameEngine';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const DEFAULT_ADMIN_KEY = 'CS2027';

function getAdminKey(): string {
  return process.env.ADMIN_KEY || DEFAULT_ADMIN_KEY;
}

export function registerAdminHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('admin:create-room', (data, callback) => {
    if (data.key !== getAdminKey()) return callback({ ok: false, error: 'Clave incorrecta' });
    const range = data.range ?? DEFAULT_NUMBER_RANGE;
    const room = roomStore.create(socket.id, range);
    socket.join(room.code);
    callback({ ok: true, code: room.code });
  });

  socket.on('admin:start-game', (data, callback) => {
    const room = roomStore.get(data.code);
    if (!room) return callback({ ok: false, error: 'Sala no encontrada' });
    if (room.adminSocketId !== socket.id) return callback({ ok: false, error: 'No eres admin' });
    if (room.status !== RoomStatus.LOBBY) return callback({ ok: false, error: 'La sala no está en lobby' });
    if (room.players.size < 2) return callback({ ok: false, error: 'Se necesitan al menos 2 jugadores' });

    assignSecretNumbers(room);
    // Jugadores reciben PublicPlayer (sin secretNumber)
    socket.to(room.code).emit('game:started', { players: getPublicPlayers(room) });
    // Admin recibe AdminPlayer (con secretNumber)
    socket.emit('game:started', { players: getAdminPlayers(room) });
    callback({ ok: true });
  });

  socket.on('admin:execute-operation', (data, callback) => {
    const room = roomStore.get(data.code);
    if (!room) return callback({ ok: false, error: 'Sala no encontrada' });
    if (room.adminSocketId !== socket.id) return callback({ ok: false, error: 'No eres admin' });
    if (room.status !== RoomStatus.PLAYING) return callback({ ok: false, error: 'El juego no está en curso' });

    const result = executeOperation(room, data.playerAId, data.playerBId, data.operation);
    if (!result.ok) return callback({ ok: false, error: result.error });

    io.to(room.code).emit('game:operation-result', { move: result.move! });
    callback({ ok: true, result: result.move!.result });
  });

  socket.on('admin:sacrifice', (data, callback) => {
    const room = roomStore.get(data.code);
    if (!room) return callback({ ok: false, error: 'Sala no encontrada' });
    if (room.adminSocketId !== socket.id) return callback({ ok: false, error: 'No eres admin' });
    if (room.status !== RoomStatus.PLAYING) return callback({ ok: false, error: 'El juego no está en curso' });
    if (room.sacrificesRemaining <= 0) return callback({ ok: false, error: 'No quedan sacrificios disponibles' });

    const player = room.players.get(data.playerId);
    if (!player) return callback({ ok: false, error: 'Jugador no encontrado' });

    room.sacrificesRemaining--;
    player.sacrificeCount++;
    player.availableOperations.push(Operation.ADD, Operation.MULTIPLY, Operation.DIVIDE, Operation.ZERO_CARD);

    io.to(room.code).emit('game:sacrifice-used', {
      playerId: data.playerId,
      playerName: player.name,
      sacrificesRemaining: room.sacrificesRemaining,
      availableOperations: [...player.availableOperations],
    });
    callback({ ok: true });
  });

  socket.on('admin:end-game', (data, callback) => {
    const room = roomStore.get(data.code);
    if (!room) return callback({ ok: false, error: 'Sala no encontrada' });
    if (room.adminSocketId !== socket.id) return callback({ ok: false, error: 'No eres admin' });
    if (room.status !== RoomStatus.PLAYING) return callback({ ok: false, error: 'El juego no está en curso' });

    room.status = RoomStatus.FINISHED;
    const scores = calculateScores(room);
    io.to(room.code).emit('game:results', { scores });
    callback({ ok: true });
  });
}
