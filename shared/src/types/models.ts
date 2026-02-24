import { RoomStatus, Operation } from './enums';

export interface Player {
  id: string;
  name: string;
  socketId: string;
  secretNumber: number;
  availableOperations: Operation[];
  sacrificeCount: number;
  guesses: Record<string, number | null>; // playerId -> guessed number
  bet: string | null; // playerId of who they bet will finish last
  submitted: boolean;
  connected: boolean;
  score?: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  secretNumber?: number;
  availableOperations: Operation[];
  hasBet: boolean;
  submitted: boolean;
  connected: boolean;
  score?: number;
}

export interface Move {
  id: string;
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  operation: Operation;
  result: number | string;
  timestamp: number;
}

export interface Room {
  code: string;
  adminSocketId: string;
  status: RoomStatus;
  players: Map<string, Player>;
  moves: Move[];
  numberRange: { min: number; max: number };
  sacrificesRemaining: number;
  createdAt: number;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  secretNumber: number;
  selfCorrect: boolean;
  selfPoints: number;
  othersCorrect: number;
  othersIncorrect: number;
  othersBlank: number;
  othersPoints: number;
  guessedByOthers: number;
  guessedByPenalty: number;
  betTargetName: string | null;
  betCorrect: boolean | null;
  betPoints: number;
  sacrificePenalty: number;
  score: number;
}
