import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Operation, type Move } from 'shared';
import { useSocket } from '../../contexts/SocketContext';
import { useGame } from '../../contexts/GameContext';
import Header from '../../components/shared/Header';

const OP_LABELS: Record<Operation, string> = {
  [Operation.ADD]: '+',
  [Operation.MULTIPLY]: 'x',
  [Operation.DIVIDE]: '/',
  [Operation.ZERO_CARD]: '0',
};

const OP_CLASSES: Record<Operation, string> = {
  [Operation.ADD]: 'op-add',
  [Operation.MULTIPLY]: 'op-mul',
  [Operation.DIVIDE]: 'op-div',
  [Operation.ZERO_CARD]: 'op-zero',
};

export default function PlayerGame() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useGame();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const saveGuesses = useCallback(
    (guesses: Record<string, number | null>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (state.roomCode && state.playerId) {
          socket.emit('player:update-guesses', {
            code: state.roomCode,
            playerId: state.playerId,
            guesses,
          });
        }
      }, 500);
    },
    [socket, state.roomCode, state.playerId]
  );

  useEffect(() => {
    socket.on('game:operation-result', (data) => {
      dispatch({ type: 'ADD_MOVE', move: data.move });
    });

    socket.on('game:player-submitted', (data) => {
      dispatch({ type: 'PLAYER_SUBMITTED', playerId: data.playerId });
    });

    socket.on('game:coin-used', (data) => {
      dispatch({ type: 'COIN_USED', playerId: data.playerId, coins: data.coins, availableOperations: data.availableOperations });
    });

    socket.on('game:results', (data) => {
      dispatch({ type: 'SET_SCORES', scores: data.scores });
      navigate('/play/results');
    });

    return () => {
      socket.off('game:operation-result');
      socket.off('game:player-submitted');
      socket.off('game:coin-used');
      socket.off('game:results');
    };
  }, [socket, dispatch, navigate]);

  const handleGuessChange = (playerId: string, value: string) => {
    const num = value === '' ? null : parseInt(value, 10);
    const newGuesses = { ...state.guesses, [playerId]: isNaN(num as number) ? null : num };
    dispatch({ type: 'SET_GUESSES', guesses: newGuesses });
    saveGuesses(newGuesses);
  };

  const handleSubmit = () => {
    if (!state.roomCode || !state.playerId) return;
    socket.emit('player:update-guesses', {
      code: state.roomCode,
      playerId: state.playerId,
      guesses: state.guesses,
    });
    socket.emit('player:submit-guesses', { code: state.roomCode, playerId: state.playerId }, (res) => {
      if (res.ok) {
        dispatch({ type: 'SET_SUBMITTED' });
      } else {
        alert(res.error);
      }
    });
  };

  const handleUseCoin = () => {
    if (!state.roomCode || !state.playerId) return;
    socket.emit('player:use-coin', { code: state.roomCode, playerId: state.playerId }, (res) => {
      if (!res.ok) alert(res.error);
    });
  };

  const me = state.players.find((p) => p.id === state.playerId);
  const otherPlayers = state.players.filter((p) => p.id !== state.playerId);
  const myOps = me?.availableOperations ?? [];
  const myCoins = me?.coins ?? 4;

  return (
    <div className="flex flex-col min-h-dvh">
      <Header title="Partida" roomCode={state.roomCode} />

      {/* Desktop: 2 columns / Mobile: stack */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left panel: cards + guesses + submit */}
        <div className="md:w-[55%] overflow-y-auto px-5 py-5 space-y-5">
          {/* My operation cards + coins */}
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-bbva-gray">
                Tus cartas
              </p>
              <span className="font-mono text-xs text-bbva-warning">
                {myCoins} moneda{myCoins !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {([Operation.ADD, Operation.MULTIPLY, Operation.DIVIDE, Operation.ZERO_CARD] as Operation[]).map((op) => {
                const count = myOps.filter((o) => o === op).length;
                return (
                  <span
                    key={op}
                    className={`relative w-11 h-11 flex items-center justify-center rounded-xl text-lg font-mono font-bold transition-all
                      ${count > 0
                        ? 'glass border border-bbva-aqua/20 text-bbva-white/80'
                        : 'bg-bbva-navy-light/50 text-bbva-gray/30'
                      }
                    `}
                  >
                    {OP_LABELS[op]}
                    {count > 1 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-bbva-aqua text-[10px] font-bold text-bbva-navy">
                        x{count}
                      </span>
                    )}
                  </span>
                );
              })}
              <button
                onClick={handleUseCoin}
                disabled={myCoins <= 0}
                className="ml-auto px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-bbva-warning/15 text-bbva-warning border border-bbva-warning/25 hover:bg-bbva-warning/25 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Usar moneda
              </button>
            </div>
          </div>

          {/* Guess grid */}
          <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-bbva-gray mb-2">
              Adivinanzas
            </h2>
            <div className="space-y-2">
              {otherPlayers.map((p) => (
                <div key={p.id} className="glass rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <span className="flex-1 text-sm font-medium text-bbva-white/70 truncate">{p.name}</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={state.guesses[p.id] ?? ''}
                    onChange={(e) => handleGuessChange(p.id, e.target.value)}
                    disabled={state.submitted}
                    placeholder="?"
                    className="input-glass w-20 rounded-lg px-2 py-2 text-center font-mono text-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit button (inside left panel on desktop) */}
          <div className="hidden md:block animate-fade-up" style={{ animationDelay: '200ms' }}>
            {state.submitted ? (
              <div className="text-center py-3 animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-bbva-success font-semibold">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Respuestas enviadas
                </div>
                <p className="text-xs text-bbva-gray mt-1">Esperando resultados...</p>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                className="btn-mint w-full py-4 rounded-xl text-lg font-display"
              >
                Enviar Respuestas
              </button>
            )}
          </div>
        </div>

        {/* Right panel: move history */}
        <div className="md:w-[45%] md:border-l md:border-bbva-core-blue/15 overflow-y-auto px-5 py-5">
          <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-mono uppercase tracking-widest text-bbva-gray">
                Historial
              </h2>
              <span className="font-mono text-xs text-bbva-gray/50">{state.moves.length}</span>
            </div>
            {state.moves.length === 0 ? (
              <div className="glass rounded-xl px-4 py-6 text-center">
                <p className="text-bbva-gray text-sm">Sin operaciones aun</p>
              </div>
            ) : (
              <div className="space-y-1.5 stagger-children">
                {[...state.moves].reverse().map((m) => (
                  <div key={m.id} className="glass rounded-xl px-3.5 py-2.5 flex items-center justify-between text-sm animate-slide-left">
                    <span>
                      <span className="font-medium text-bbva-white/70">{m.playerAName}</span>
                      <span className={`mx-1.5 font-mono font-bold ${OP_CLASSES[m.operation]}`}>
                        {OP_LABELS[m.operation]}
                      </span>
                      <span className="font-medium text-bbva-white/70">{m.playerBName}</span>
                    </span>
                    <span className="font-mono font-bold text-bbva-warning">= {m.result}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-only fixed submit footer */}
      <div className="md:hidden glass-strong p-4">
        {state.submitted ? (
          <div className="text-center py-3 animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-bbva-success font-semibold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Respuestas enviadas
            </div>
            <p className="text-xs text-bbva-gray mt-1">Esperando resultados...</p>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            className="btn-mint w-full py-4 rounded-xl text-lg font-display"
          >
            Enviar Respuestas
          </button>
        )}
      </div>
    </div>
  );
}
