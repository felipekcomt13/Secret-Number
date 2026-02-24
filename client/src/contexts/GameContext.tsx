import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { PublicPlayer, Move, PlayerScore, Operation } from 'shared';

interface GameState {
  role: 'admin' | 'player' | null;
  roomCode: string | null;
  playerId: string | null;
  playerName: string | null;
  players: PublicPlayer[];
  moves: Move[];
  scores: PlayerScore[];
  guesses: Record<string, number | null>;
  submitted: boolean;
}

type GameAction =
  | { type: 'SET_ROLE'; role: 'admin' | 'player' }
  | { type: 'SET_ROOM'; code: string }
  | { type: 'SET_PLAYER'; playerId: string; playerName: string }
  | { type: 'SET_PLAYERS'; players: PublicPlayer[] }
  | { type: 'ADD_PLAYER'; player: PublicPlayer; players: PublicPlayer[] }
  | { type: 'PLAYER_DISCONNECTED'; playerId: string }
  | { type: 'PLAYER_RECONNECTED'; playerId: string }
  | { type: 'GAME_STARTED'; players: PublicPlayer[] }
  | { type: 'ADD_MOVE'; move: Move }
  | { type: 'UPDATE_PLAYERS_OPS'; players: PublicPlayer[] }
  | { type: 'COIN_USED'; playerId: string; coins: number; availableOperations: Operation[] }
  | { type: 'PLAYER_SUBMITTED'; playerId: string }
  | { type: 'SET_GUESSES'; guesses: Record<string, number | null> }
  | { type: 'SET_SUBMITTED' }
  | { type: 'SET_SCORES'; scores: PlayerScore[] }
  | { type: 'RESET' };

const initialState: GameState = {
  role: null,
  roomCode: null,
  playerId: null,
  playerName: null,
  players: [],
  moves: [],
  scores: [],
  guesses: {},
  submitted: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.role };
    case 'SET_ROOM':
      return { ...state, roomCode: action.code };
    case 'SET_PLAYER':
      return { ...state, playerId: action.playerId, playerName: action.playerName };
    case 'SET_PLAYERS':
      return { ...state, players: action.players };
    case 'ADD_PLAYER':
      return { ...state, players: action.players };
    case 'PLAYER_DISCONNECTED':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, connected: false } : p
        ),
      };
    case 'PLAYER_RECONNECTED':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, connected: true } : p
        ),
      };
    case 'GAME_STARTED':
      return { ...state, players: action.players };
    case 'ADD_MOVE':
      return {
        ...state,
        moves: [...state.moves, action.move],
        // Update player operations from move
        players: state.players.map((p) => {
          if (p.id === action.move.playerAId || p.id === action.move.playerBId) {
            return {
              ...p,
              availableOperations: (() => {
                const ops = [...p.availableOperations];
                const idx = ops.indexOf(action.move.operation);
                if (idx !== -1) ops.splice(idx, 1);
                return ops;
              })(),
            };
          }
          return p;
        }),
      };
    case 'COIN_USED':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId
            ? { ...p, coins: action.coins, availableOperations: action.availableOperations }
            : p
        ),
      };
    case 'PLAYER_SUBMITTED':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, submitted: true } : p
        ),
      };
    case 'SET_GUESSES':
      return { ...state, guesses: action.guesses };
    case 'SET_SUBMITTED':
      return { ...state, submitted: true };
    case 'SET_SCORES':
      return { ...state, scores: action.scores };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
