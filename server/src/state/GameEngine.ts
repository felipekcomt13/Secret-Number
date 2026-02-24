import {
  Room,
  Player,
  PublicPlayer,
  Move,
  PlayerScore,
  Operation,
  RoomStatus,
  computeOperation,
  isOperationAvailable,
} from 'shared';
import { randomUUID } from 'crypto';

export function assignSecretNumbers(room: Room): void {
  const { min, max } = room.numberRange;
  for (const player of room.players.values()) {
    player.secretNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  room.status = RoomStatus.PLAYING;
}

export function executeOperation(
  room: Room,
  playerAId: string,
  playerBId: string,
  operation: Operation
): { ok: boolean; move?: Move; error?: string } {
  const playerA = room.players.get(playerAId);
  const playerB = room.players.get(playerBId);

  if (!playerA || !playerB) {
    return { ok: false, error: 'Jugador no encontrado' };
  }

  if (playerAId === playerBId) {
    return { ok: false, error: 'No puedes operar un jugador consigo mismo' };
  }

  if (!isOperationAvailable(playerA.availableOperations, playerB.availableOperations, operation)) {
    return { ok: false, error: 'Operación no disponible para este par' };
  }

  const a = playerA.secretNumber;
  const b = playerB.secretNumber;
  const result = computeOperation(a, b, operation);

  if (result === null) {
    return { ok: false, error: 'Operación no válida' };
  }

  // Consume one copy of the operation card from each player
  const idxA = playerA.availableOperations.indexOf(operation);
  if (idxA !== -1) playerA.availableOperations.splice(idxA, 1);
  const idxB = playerB.availableOperations.indexOf(operation);
  if (idxB !== -1) playerB.availableOperations.splice(idxB, 1);

  const move: Move = {
    id: randomUUID(),
    playerAId,
    playerAName: playerA.name,
    playerBId,
    playerBName: playerB.name,
    operation,
    result,
    timestamp: Date.now(),
  };

  room.moves.push(move);
  return { ok: true, move };
}

export function calculateScores(room: Room): PlayerScore[] {
  const playerIds = Array.from(room.players.keys());

  return playerIds.map((pid) => {
    const player = room.players.get(pid)!;
    let correct = 0;
    let incorrect = 0;
    let blank = 0;

    for (const otherId of playerIds) {
      if (otherId === pid) continue;
      const guessed = player.guesses[otherId];
      const actual = room.players.get(otherId)!.secretNumber;

      if (guessed == null) {
        blank++;
      } else if (guessed === actual) {
        correct++;
      } else {
        incorrect++;
      }
    }

    const score = correct - incorrect;

    return {
      playerId: pid,
      playerName: player.name,
      secretNumber: player.secretNumber,
      correct,
      incorrect,
      blank,
      score,
    };
  }).sort((a, b) => b.score - a.score);
}

export function toPublicPlayer(player: Player): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    availableOperations: [...player.availableOperations],
    coins: player.coins,
    submitted: player.submitted,
    connected: player.connected,
    score: player.score,
  };
}

export function toAdminPlayer(player: Player): PublicPlayer {
  return {
    ...toPublicPlayer(player),
    secretNumber: player.secretNumber,
  };
}

export function getPublicPlayers(room: Room): PublicPlayer[] {
  return Array.from(room.players.values()).map(toPublicPlayer);
}

export function getAdminPlayers(room: Room): PublicPlayer[] {
  return Array.from(room.players.values()).map(toAdminPlayer);
}
