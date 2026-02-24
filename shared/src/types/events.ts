import { Operation } from './enums';
import { PublicPlayer, Move, PlayerScore } from './models';


export interface ClientToServerEvents {
  'admin:create-room': (
    data: { key: string; range?: { min: number; max: number } },
    callback: (response: { ok: boolean; code?: string; error?: string }) => void
  ) => void;

  'player:join-room': (
    data: { code: string; name: string },
    callback: (response: { ok: boolean; playerId?: string; error?: string }) => void
  ) => void;

  'admin:start-game': (
    data: { code: string },
    callback: (response: { ok: boolean; error?: string }) => void
  ) => void;

  'admin:execute-operation': (
    data: { code: string; playerAId: string; playerBId: string; operation: Operation },
    callback: (response: { ok: boolean; result?: number; error?: string }) => void
  ) => void;

  'player:update-guesses': (
    data: { code: string; playerId: string; guesses: Record<string, number | null> }
  ) => void;

  'player:submit-guesses': (
    data: { code: string; playerId: string },
    callback: (response: { ok: boolean; error?: string }) => void
  ) => void;

  'admin:end-game': (
    data: { code: string },
    callback: (response: { ok: boolean; error?: string }) => void
  ) => void;

  'player:use-coin': (
    data: { code: string; playerId: string },
    callback: (response: { ok: boolean; error?: string }) => void
  ) => void;

  'player:reconnect': (
    data: { code: string; playerId: string },
    callback: (response: { ok: boolean; players?: PublicPlayer[]; moves?: Move[]; error?: string }) => void
  ) => void;
}

export interface ServerToClientEvents {
  'room:player-joined': (data: { player: PublicPlayer; players: PublicPlayer[] }) => void;
  'room:player-disconnected': (data: { playerId: string }) => void;
  'room:player-reconnected': (data: { playerId: string }) => void;
  'game:started': (data: { players: PublicPlayer[] }) => void;
  'game:operation-result': (data: { move: Move }) => void;
  'game:player-submitted': (data: { playerId: string; playerName: string }) => void;
  'game:results': (data: { scores: PlayerScore[] }) => void;
  'game:coin-used': (data: { playerId: string; coins: number; availableOperations: Operation[] }) => void;
  'room:closed': (data: { reason: string }) => void;
  'error': (data: { message: string }) => void;
}
