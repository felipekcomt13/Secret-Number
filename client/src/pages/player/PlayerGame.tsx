import { useEffect, useRef, useCallback, useState } from 'react';
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

const OP_DESCRIPTIONS: Record<Operation, string> = {
  [Operation.ADD]: 'Revela la suma de ambos números. Si es mayor a 180 o menor a 20, solo indica el rango.',
  [Operation.MULTIPLY]: 'Revela únicamente el último dígito del producto entre ambos números.',
  [Operation.DIVIDE]: 'Divide el mayor entre el menor, sin decimales.',
  [Operation.ZERO_CARD]: 'Cuenta cuántos números entre ambos contienen el dígito 0.',
};

const OP_NAMES: Record<Operation, string> = {
  [Operation.ADD]: 'Suma',
  [Operation.MULTIPLY]: 'Multiplicación',
  [Operation.DIVIDE]: 'División',
  [Operation.ZERO_CARD]: 'Carta Cero',
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

    socket.on('game:sacrifice-used', (data) => {
      dispatch({ type: 'SACRIFICE_USED', playerId: data.playerId, playerName: data.playerName, sacrificesRemaining: data.sacrificesRemaining, availableOperations: data.availableOperations });
      // Screen shake + flash overlay + vibrate
      const root = document.getElementById('game-root');
      if (root) {
        root.classList.add('sacrifice-shake');
        setTimeout(() => root.classList.remove('sacrifice-shake'), 600);
      }
      const overlay = document.createElement('div');
      overlay.className = 'sacrifice-overlay';
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 1300);
      if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
    });

    socket.on('game:bet-placed', (data) => {
      dispatch({ type: 'BET_PLACED', playerId: data.playerId });
    });

    socket.on('game:guess-changed', (data) => {
      dispatch({ type: 'GUESS_CHANGED', playerName: data.playerName, targetName: data.targetName, action: data.action });
    });

    socket.on('game:results', (data) => {
      dispatch({ type: 'SET_SCORES', scores: data.scores });
      navigate('/play/results');
    });

    return () => {
      socket.off('game:operation-result');
      socket.off('game:player-submitted');
      socket.off('game:sacrifice-used');
      socket.off('game:bet-placed');
      socket.off('game:guess-changed');
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

  const [showNumbers, setShowNumbers] = useState(true);
  const [betChoice, setBetChoice] = useState<string>('');

  const handlePlaceBet = (targetId: string | null) => {
    if (!state.roomCode || !state.playerId) return;
    socket.emit('player:place-bet', { code: state.roomCode, playerId: state.playerId, targetId }, (res) => {
      if (res.ok) {
        dispatch({ type: 'BET_SUBMITTED' });
      } else {
        alert(res.error);
      }
    });
  };

  const me = state.players.find((p) => p.id === state.playerId);
  const allPlayers = [
    ...state.players.filter((p) => p.id === state.playerId),
    ...state.players.filter((p) => p.id !== state.playerId),
  ];
  const myOps = me?.availableOperations ?? [];

  return (
    <div id="game-root" className="flex flex-col min-h-dvh">
      <Header title="Partida" roomCode={state.roomCode} playerName={state.playerName} />

      {/* Desktop: 2 columns / Mobile: stack */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left panel: cards + guesses + submit */}
        <div className="md:w-[55%] overflow-y-auto px-5 py-5 space-y-5">
          {/* My operation cards */}
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-bbva-gray">
                Tus cartas
              </p>
              <div className="flex items-center gap-2.5">
                <span className={`text-xl ${state.sacrificesRemaining > 0 ? 'sacrifice-fire' : 'opacity-30'}`}>🔥</span>
                <div className="sacrifice-counter">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className={`dot ${i < state.sacrificesRemaining ? 'active' : 'spent'}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {([Operation.ADD, Operation.MULTIPLY, Operation.DIVIDE, Operation.ZERO_CARD] as Operation[]).map((op) => {
                const count = myOps.filter((o) => o === op).length;
                return (
                  <div key={op} className="tooltip-wrap">
                    <span
                      className={`relative w-11 h-11 flex items-center justify-center rounded-xl text-lg font-mono font-bold transition-all cursor-help
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
                    <div className="tooltip">
                      <span className={`font-semibold ${OP_CLASSES[op]}`}>{OP_NAMES[op]}</span>
                      <br />
                      {OP_DESCRIPTIONS[op]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guess grid */}
          <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-mono uppercase tracking-widest text-bbva-gray">
                Completa los numeros secretos
              </h2>
              <button
                onClick={() => setShowNumbers(!showNumbers)}
                className="text-bbva-gray hover:text-bbva-aqua transition-colors p-1"
                title={showNumbers ? 'Ocultar números' : 'Mostrar números'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showNumbers ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  ) : (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {allPlayers.map((p) => (
                <div key={p.id} className="glass rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <span className="flex-1 text-sm font-medium text-bbva-white/70 truncate">{p.name}</span>
                  <input
                    type={showNumbers ? 'number' : 'password'}
                    min={1}
                    max={100}
                    value={state.guesses[p.id] ?? ''}
                    onChange={(e) => handleGuessChange(p.id, e.target.value)}
                    disabled={state.submitted}
                    placeholder="?"
                    className="input-glass w-16 md:w-20 rounded-lg px-2 py-2 text-center font-mono text-lg"
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

        {/* Right panel: activity feed */}
        <div className="md:w-[45%] md:border-l md:border-bbva-core-blue/15 overflow-y-auto px-5 py-5">
          <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-mono uppercase tracking-widest text-bbva-gray">
                Actividad
              </h2>
              <span className="font-mono text-xs text-bbva-gray/50">{state.activities.length}</span>
            </div>
            {state.activities.length === 0 ? (
              <div className="glass rounded-xl px-4 py-6 text-center">
                <p className="text-bbva-gray text-sm">Esperando actividad...</p>
              </div>
            ) : (
              <div className="space-y-1.5 stagger-children">
                {[...state.activities].reverse().map((a) => (
                  <div key={a.id} className="glass rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-sm animate-slide-left">
                    <span className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg font-mono font-bold text-sm
                      ${a.kind === 'operation' ? `${OP_CLASSES[a.icon as Operation]} bg-bbva-navy-light` : ''}
                      ${a.kind === 'submitted' ? 'bg-bbva-success/15 text-bbva-success' : ''}
                      ${a.kind === 'sacrifice' ? 'bg-bbva-danger/15 text-bbva-danger' : ''}
                      ${a.kind === 'misc' ? 'bg-bbva-gray/15 text-bbva-gray' : ''}
                    `}>
                      {a.kind === 'operation' ? OP_LABELS[a.icon as Operation] : a.icon}
                    </span>
                    <span className="text-bbva-white/70 leading-snug">{a.text}</span>
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

      {/* Bet modal */}
      {!state.betSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative glass rounded-2xl p-6 w-full max-w-sm space-y-5 animate-scale-in border border-bbva-warning/15">
            <div className="text-center space-y-2">
              <span className="text-4xl">🎲</span>
              <h2 className="font-display text-xl font-bold text-bbva-white">
                Apuesta
              </h2>
              <p className="text-sm text-bbva-gray">
                ¿Quién crees que quedará en último lugar?
              </p>
            </div>

            <div className="space-y-2">
              {state.players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setBetChoice(p.id)}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all
                    ${betChoice === p.id
                      ? 'bg-bbva-warning/20 text-bbva-warning border border-bbva-warning/40 glow-amber'
                      : 'glass text-bbva-white/70 hover:bg-bbva-blue/30'
                    }
                  `}
                >
                  {p.name}
                  {p.id === state.playerId && <span className="text-bbva-gray text-xs ml-1.5">(tú)</span>}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePlaceBet(betChoice || null)}
              disabled={!betChoice}
              className="btn-primary w-full py-3.5 rounded-xl font-display text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Confirmar Apuesta
            </button>

            <button
              onClick={() => handlePlaceBet(null)}
              className="w-full text-center text-xs text-bbva-gray/60 hover:text-bbva-gray transition-colors underline underline-offset-2"
            >
              No quiero apostar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
