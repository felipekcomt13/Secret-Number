import { RoomStatus, Operation } from './enums';

export interface Player {
  id: string;
  name: string;
  socketId: string;
  secretNumber: number;
  availableOperations: Operation[];
  coins: number;
  guesses: Record<string, number | null>; // playerId -> guessed number
  submitted: boolean;
  connected: boolean;
  score?: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  secretNumber?: number;
  availableOperations: Operation[];
  coins: number;
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
  result: number;
  timestamp: number;
}

export interface Room {
  code: string;
  adminSocketId: string;
  status: RoomStatus;
  players: Map<string, Player>;
  moves: Move[];
  numberRange: { min: number; max: number };
  createdAt: number;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  secretNumber: number;
  correct: number;
  incorrect: number;
  blank: number;
  score: number;
}
