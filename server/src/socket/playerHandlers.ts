import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomStatus,
  Operation,
  MAX_PLAYERS,
} from 'shared';
import { roomStore } from '../state/RoomStore';
import { toPublicPlayer, getPublicPlayers } from '../state/GameEngine';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerPlayerHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('player:join-room', (data, callback) => {
    const code = data.code.toUpperCase();
    const room = roomStore.get(code);
    if (!room) return callback({ ok: false, error: 'Sala no encontrada' });
    if (room.status !== RoomStatus.LOBBY) return callback({ ok: false, error: 'La partida ya comenzó' });
    if (room.players.size >= MAX_PLAYERS) return callback({ ok: false, error: 'Sala llena' });

    const name = data.name.trim();
    if (!name) return callback({ ok: false, error: 'Nombre requerido' });

    // Check duplicate name
    for (const p of room.players.values()) {
      if (p.name.toLowerCase() === name.toLowerCase()) {
        return callback({ ok: false, error: 'Nombre ya en uso' });
      }
    }

    const playerId = randomUUID();
    room.players.set(playerId, {
      id: playerId,
      name,
      socketId: socket.id,
      secretNumber: 0,
      availableOperations: [Operation.ADD, Operation.MULTIPLY, Operation.DIVIDE, Operation.ZERO_CARD],
      sacrificeCount: 0,
      guesses: {},
      bet: null,
      submitted: false,
      connected: true,
    });

    socket.join(code);

    const publicPlayer = toPublicPlayer(room.players.get(playerId)!);
    const allPlayers = getPublicPlayers(room);

    socket.to(code).emit('room:player-joined', { player: publicPlayer, players: allPlayers });
    callback({ ok: true, playerId });
  });

  socket.on('player:update-guesses', (data) => {
    const room = roomStore.get(data.code);
    if (!room) return;
    const player = room.players.get(data.playerId);
    if (!player) return;

    const oldGuesses = player.guesses;
    const newGuesses = data.guesses;

    // Detect changes and notify
    for (const targetId of Object.keys(newGuesses)) {
      const wasSet = oldGuesses[targetId] != null;
      const isSet = newGuesses[targetId] != null;
      if (wasSet !== isSet) {
        const target = room.players.get(targetId);
        if (target) {
          io.to(room.code).emit('game:guess-changed', {
            playerName: player.name,
            targetName: target.name,
            action: isSet ? 'set' : 'removed',
          });
        }
      }
    }
    // Detect removals (keys in old but not in new)
    for (const targetId of Object.keys(oldGuesses)) {
      if (oldGuesses[targetId] != null && !(targetId in newGuesses)) {
        const target = room.players.get(targetId);
        if (target) {
          io.to(room.code).emit('game:guess-changed', {
            playerName: player.name,
            targetName: target.name,
            action: 'removed',
          });
        }
      }
    }

    player.guesses = newGuesses;
  });

  socket.on('player:place-bet', (data, callback) => {
    const room = roomStore.get(data.code);
    if (!room) return callback({ ok: false, error: 'Sala no encontrada' });
    if (room.status !== RoomStatus.PLAYING) return callback({ ok: false, error: 'El juego no está en curso' });

    const player = room.players.get(data.playerId);
    if (!player) return callback({ ok: false, error: 'Jugador no encontrado' });
    if (player.bet !== null) return callback({ ok: false, error: 'Ya realizaste tu apuesta' });

    if (data.targetId && !room.players.has(data.targetId)) {
      return callback({ ok: false, error: 'Jugador objetivo no encontrado' });
    }

    player.bet = data.targetId ?? 'skip';
    io.to(room.code).emit('game:bet-placed', { playerId: data.playerId });
    callback({ ok: true });
  });

  socket.on('player:submit-guesses', (data, callback) => {
    const room = roomStore.get(data.code);
    if (!room) return callback({ ok: false, error: 'Sala no encontrada' });
    if (room.status !== RoomStatus.PLAYING) return callback({ ok: false, error: 'El juego no está en curso' });

    const player = room.players.get(data.playerId);
    if (!player) return callback({ ok: false, error: 'Jugador no encontrado' });
    if (player.submitted) return callback({ ok: false, error: 'Ya enviaste tus respuestas' });

    player.submitted = true;
    io.to(room.code).emit('game:player-submitted', {
      playerId: data.playerId,
      playerName: player.name,
    });
    callback({ ok: true });
  });
}
