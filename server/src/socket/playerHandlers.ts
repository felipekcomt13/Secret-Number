import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomStatus,
  Operation,
  MAX_PLAYERS,
  INITIAL_COINS,
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
      coins: INITIAL_COINS,
      guesses: {},
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
    player.guesses = data.guesses;
  });

  socket.on('player:use-coin', (data, callback) => {
    console.log('[use-coin] Recibido:', { code: data.code, playerId: data.playerId });

    const room = roomStore.get(data.code);
    if (!room) { console.log('[use-coin] ERROR: Sala no encontrada'); return callback({ ok: false, error: 'Sala no encontrada' }); }
    if (room.status !== RoomStatus.PLAYING) { console.log('[use-coin] ERROR: Juego no en curso, status=', room.status); return callback({ ok: false, error: 'El juego no está en curso' }); }

    const player = room.players.get(data.playerId);
    if (!player) { console.log('[use-coin] ERROR: Jugador no encontrado'); return callback({ ok: false, error: 'Jugador no encontrado' }); }
    if (player.coins <= 0) { console.log('[use-coin] ERROR: Sin monedas, coins=', player.coins); return callback({ ok: false, error: 'No tienes monedas' }); }

    console.log('[use-coin] ANTES:', { name: player.name, coins: player.coins, ops: player.availableOperations });

    player.coins--;
    player.availableOperations.push(Operation.ADD, Operation.MULTIPLY, Operation.DIVIDE, Operation.ZERO_CARD);

    console.log('[use-coin] DESPUÉS:', { name: player.name, coins: player.coins, ops: player.availableOperations });

    const payload = {
      playerId: data.playerId,
      coins: player.coins,
      availableOperations: [...player.availableOperations],
    };
    console.log('[use-coin] Emitiendo game:coin-used:', payload);

    io.to(room.code).emit('game:coin-used', payload);
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
