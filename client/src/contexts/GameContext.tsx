import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { MAX_SACRIFICES, type PublicPlayer, type Move, type PlayerScore, type Operation, type RoomStatus } from 'shared';

export interface Activity {
  id: string;
  kind: 'operation' | 'submitted' | 'sacrifice' | 'misc';
  text: string;
  timestamp: number;
  icon: string;
}

interface GameState {
  role: 'admin' | 'player' | null;
  roomCode: string | null;
  playerId: string | null;
  playerName: string | null;
  players: PublicPlayer[];
  moves: Move[];
  activities: Activity[];
  scores: PlayerScore[];
  sacrificesRemaining: number;
  guesses: Record<string, number | null>;
  bet: string | null;
  betSubmitted: boolean;
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
  | { type: 'SET_BET'; bet: string | null }
  | { type: 'BET_SUBMITTED' }
  | { type: 'BET_PLACED'; playerId: string }
  | { type: 'SACRIFICE_USED'; playerId: string; playerName: string; sacrificesRemaining: number; availableOperations: Operation[] }
  | { type: 'PLAYER_SUBMITTED'; playerId: string }
  | { type: 'GUESS_CHANGED'; playerName: string; targetName: string; action: 'set' | 'removed' }
  | { type: 'SET_GUESSES'; guesses: Record<string, number | null> }
  | { type: 'SET_SUBMITTED' }
  | { type: 'SET_SCORES'; scores: PlayerScore[] }
  | { type: 'RESTORE_PLAYER_SESSION'; roomCode: string; playerId: string; playerName: string; players: PublicPlayer[]; moves: Move[]; guesses: Record<string, number | null>; submitted: boolean; betSubmitted: boolean; sacrificesRemaining: number; status: RoomStatus }
  | { type: 'RESTORE_ADMIN_SESSION'; roomCode: string; players: PublicPlayer[]; moves: Move[]; sacrificesRemaining: number; status: RoomStatus; scores?: PlayerScore[] }
  | { type: 'RESET' };

const OP_FRIENDLY: Record<string, string> = {
  '+': 'Suma',
  '*': 'Multiplicación',
  '/': 'División',
  '0': 'Carta Cero',
};

const initialState: GameState = {
  role: null,
  roomCode: null,
  playerId: null,
  playerName: null,
  players: [],
  moves: [],
  activities: [],
  scores: [],
  sacrificesRemaining: MAX_SACRIFICES,
  guesses: {},
  bet: null,
  betSubmitted: false,
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
    case 'SET_BET':
      return { ...state, bet: action.bet };
    case 'BET_SUBMITTED':
      return { ...state, betSubmitted: true };
    case 'BET_PLACED': {
      const betPlayer = state.players.find((p) => p.id === action.playerId);
      const betActivity: Activity = {
        id: `bet-${Date.now()}`,
        kind: 'misc',
        text: `${betPlayer?.name || 'Un jugador'} realizó su apuesta`,
        timestamp: Date.now(),
        icon: '🎲',
      };
      return {
        ...state,
        activities: [...state.activities, betActivity],
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, hasBet: true } : p
        ),
      };
    }
    case 'ADD_MOVE': {
      const m = action.move;
      const opName = OP_FRIENDLY[m.operation] || m.operation;
      const activity: Activity = {
        id: m.id,
        kind: 'operation',
        text: `${m.playerAName} y ${m.playerBName} usaron la carta "${opName}"`,
        timestamp: m.timestamp,
        icon: m.operation,
      };
      return {
        ...state,
        moves: [...state.moves, m],
        activities: [...state.activities, activity],
        players: state.players.map((p) => {
          if (p.id === m.playerAId || p.id === m.playerBId) {
            return {
              ...p,
              availableOperations: (() => {
                const ops = [...p.availableOperations];
                const idx = ops.indexOf(m.operation);
                if (idx !== -1) ops.splice(idx, 1);
                return ops;
              })(),
            };
          }
          return p;
        }),
      };
    }
    case 'SACRIFICE_USED': {
      const sacActivity: Activity = {
        id: `sac-${Date.now()}`,
        kind: 'sacrifice',
        text: `${action.playerName} usó un sacrificio (-3 pts)`,
        timestamp: Date.now(),
        icon: '🔥',
      };
      return {
        ...state,
        sacrificesRemaining: action.sacrificesRemaining,
        activities: [...state.activities, sacActivity],
        players: state.players.map((p) =>
          p.id === action.playerId
            ? { ...p, availableOperations: action.availableOperations }
            : p
        ),
      };
    }
    case 'PLAYER_SUBMITTED': {
      const subPlayer = state.players.find((p) => p.id === action.playerId);
      const subActivity: Activity = {
        id: `sub-${Date.now()}`,
        kind: 'submitted',
        text: `${subPlayer?.name || 'Un jugador'} envió sus respuestas`,
        timestamp: Date.now(),
        icon: '✓',
      };
      return {
        ...state,
        activities: [...state.activities, subActivity],
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, submitted: true } : p
        ),
      };
    }
    case 'GUESS_CHANGED': {
      const guessActivity: Activity = {
        id: `guess-${Date.now()}-${Math.random()}`,
        kind: action.action === 'set' ? 'submitted' : 'misc',
        text: action.action === 'set'
          ? `${action.playerName} registró el número de ${action.targetName}`
          : `${action.playerName} quitó el número de ${action.targetName}`,
        timestamp: Date.now(),
        icon: action.action === 'set' ? '📝' : '✕',
      };
      return {
        ...state,
        activities: [...state.activities, guessActivity],
      };
    }
    case 'SET_GUESSES':
      return { ...state, guesses: action.guesses };
    case 'SET_SUBMITTED':
      return { ...state, submitted: true };
    case 'SET_SCORES':
      return { ...state, scores: action.scores };
    case 'RESTORE_PLAYER_SESSION':
      return {
        ...state,
        role: 'player',
        roomCode: action.roomCode,
        playerId: action.playerId,
        playerName: action.playerName,
        players: action.players,
        moves: action.moves,
        guesses: action.guesses,
        submitted: action.submitted,
        betSubmitted: action.betSubmitted,
        sacrificesRemaining: action.sacrificesRemaining,
      };
    case 'RESTORE_ADMIN_SESSION':
      return {
        ...state,
        role: 'admin',
        roomCode: action.roomCode,
        players: action.players,
        moves: action.moves,
        sacrificesRemaining: action.sacrificesRemaining,
        scores: action.scores ?? [],
      };
    case 'RESET':
      clearSession();
      return initialState;
    default:
      return state;
  }
}

// ── Session persistence ──
const SESSION_KEYS = {
  role: 'sn_role',
  roomCode: 'sn_roomCode',
  playerId: 'sn_playerId',
  playerName: 'sn_playerName',
} as const;

function saveSession(state: GameState) {
  if (state.role) sessionStorage.setItem(SESSION_KEYS.role, state.role);
  if (state.roomCode) sessionStorage.setItem(SESSION_KEYS.roomCode, state.roomCode);
  if (state.playerId) sessionStorage.setItem(SESSION_KEYS.playerId, state.playerId);
  if (state.playerName) sessionStorage.setItem(SESSION_KEYS.playerName, state.playerName);
}

function clearSession() {
  Object.values(SESSION_KEYS).forEach((k) => sessionStorage.removeItem(k));
}

export function getSavedSession() {
  const role = sessionStorage.getItem(SESSION_KEYS.role) as 'admin' | 'player' | null;
  const roomCode = sessionStorage.getItem(SESSION_KEYS.roomCode);
  const playerId = sessionStorage.getItem(SESSION_KEYS.playerId);
  const playerName = sessionStorage.getItem(SESSION_KEYS.playerName);
  if (!role || !roomCode) return null;
  return { role, roomCode, playerId, playerName };
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Persist session-critical data whenever it changes
  useEffect(() => {
    if (state.role && state.roomCode) {
      saveSession(state);
    }
  }, [state.role, state.roomCode, state.playerId, state.playerName]);

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
