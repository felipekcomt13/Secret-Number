import {
  Room,
  Player,
  PublicPlayer,
  Move,
  PlayerScore,
  Operation,
  RoomStatus,
  SACRIFICE_PENALTY,
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

  // First pass: compute base scores (without bet) to determine last place
  const baseScores = new Map<string, number>();
  for (const pid of playerIds) {
    const player = room.players.get(pid)!;

    // Self guess
    const selfGuess = player.guesses[pid];
    const selfCorrect = selfGuess != null && selfGuess === player.secretNumber;
    const selfPoints = selfGuess != null ? (selfCorrect ? 5 : -5) : 0;

    // Others guesses
    let othersPoints = 0;
    for (const otherId of playerIds) {
      if (otherId === pid) continue;
      const guessed = player.guesses[otherId];
      if (guessed == null) continue;
      const actual = room.players.get(otherId)!.secretNumber;
      othersPoints += guessed === actual ? 1 : -1;
    }

    // Guessed by others penalty
    let guessedByOthers = 0;
    for (const otherId of playerIds) {
      if (otherId === pid) continue;
      const other = room.players.get(otherId)!;
      if (other.guesses[pid] != null && other.guesses[pid] === player.secretNumber) {
        guessedByOthers++;
      }
    }

    const sacrificePenalty = player.sacrificeCount * SACRIFICE_PENALTY;
    baseScores.set(pid, selfPoints + othersPoints - (guessedByOthers * 2) - sacrificePenalty);
  }

  // Find last place (lowest base score)
  let lastPlaceId = playerIds[0];
  let lowestScore = baseScores.get(playerIds[0])!;
  for (const pid of playerIds) {
    const s = baseScores.get(pid)!;
    if (s < lowestScore) {
      lowestScore = s;
      lastPlaceId = pid;
    }
  }

  // Second pass: build full PlayerScore with bet resolution
  return playerIds.map((pid) => {
    const player = room.players.get(pid)!;

    // Self guess
    const selfGuess = player.guesses[pid];
    const selfCorrect = selfGuess != null && selfGuess === player.secretNumber;
    const selfPoints = selfGuess != null ? (selfCorrect ? 5 : -5) : 0;

    // Others guesses
    let othersCorrect = 0;
    let othersIncorrect = 0;
    let othersBlank = 0;
    for (const otherId of playerIds) {
      if (otherId === pid) continue;
      const guessed = player.guesses[otherId];
      const actual = room.players.get(otherId)!.secretNumber;
      if (guessed == null) othersBlank++;
      else if (guessed === actual) othersCorrect++;
      else othersIncorrect++;
    }
    const othersPoints = othersCorrect - othersIncorrect;

    // Guessed by others
    let guessedByOthers = 0;
    for (const otherId of playerIds) {
      if (otherId === pid) continue;
      const other = room.players.get(otherId)!;
      if (other.guesses[pid] != null && other.guesses[pid] === player.secretNumber) {
        guessedByOthers++;
      }
    }
    const guessedByPenalty = guessedByOthers * 2;

    // Bet
    const hasBet = player.bet !== null && player.bet !== 'skip';
    let betTargetName: string | null = null;
    let betCorrect: boolean | null = null;
    let betPoints = 0;
    if (hasBet) {
      const betTarget = room.players.get(player.bet!);
      betTargetName = betTarget?.name ?? null;
      betCorrect = player.bet === lastPlaceId;
      betPoints = betCorrect ? 2 : -2;
    }

    const sacrificePenalty = player.sacrificeCount * SACRIFICE_PENALTY;
    const score = selfPoints + othersPoints - guessedByPenalty + betPoints - sacrificePenalty;

    return {
      playerId: pid,
      playerName: player.name,
      secretNumber: player.secretNumber,
      selfCorrect,
      selfPoints,
      othersCorrect,
      othersIncorrect,
      othersBlank,
      othersPoints,
      guessedByOthers,
      guessedByPenalty,
      betTargetName,
      betCorrect,
      betPoints,
      sacrificePenalty,
      score,
    };
  }).sort((a, b) => b.score - a.score);
}

export function toPublicPlayer(player: Player): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    availableOperations: [...player.availableOperations],
    hasBet: player.bet !== null,
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
