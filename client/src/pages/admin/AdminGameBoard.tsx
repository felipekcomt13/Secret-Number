import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Operation, isOperationAvailable, type PublicPlayer, type Move } from 'shared';
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

export default function AdminGameBoard() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useGame();

  const [playerAId, setPlayerAId] = useState<string>('');
  const [playerBId, setPlayerBId] = useState<string>('');
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [error, setError] = useState('');

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
      navigate('/admin/results');
    });

    return () => {
      socket.off('game:operation-result');
      socket.off('game:player-submitted');
      socket.off('game:coin-used');
      socket.off('game:results');
    };
  }, [socket, dispatch, navigate]);

  const playerA = state.players.find((p) => p.id === playerAId);
  const playerB = state.players.find((p) => p.id === playerBId);

  const availableOps = playerA && playerB
    ? ([Operation.ADD, Operation.MULTIPLY, Operation.DIVIDE, Operation.ZERO_CARD] as Operation[]).filter(
        (op) => isOperationAvailable(playerA.availableOperations, playerB.availableOperations, op)
      )
    : [];

  const handleExecute = () => {
    if (!state.roomCode || !playerAId || !playerBId || !selectedOp) return;
    setError('');
    socket.emit(
      'admin:execute-operation',
      { code: state.roomCode, playerAId, playerBId, operation: selectedOp },
      (res) => {
        if (res.ok) {
          setLastResult(res.result!);
          setSelectedOp(null);
        } else {
          setError(res.error ?? 'Error');
        }
      }
    );
  };

  const handleEndGame = () => {
    if (!state.roomCode) return;
    socket.emit('admin:end-game', { code: state.roomCode }, (res) => {
      if (!res.ok) alert(res.error);
    });
  };

  const submittedCount = state.players.filter((p) => p.submitted).length;

  return (
    <div className="flex flex-col min-h-dvh">
      <Header title="Partida" roomCode={state.roomCode} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: controls */}
        <div className="w-1/2 p-5 border-r border-bbva-core-blue/15 overflow-y-auto space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-widest text-bbva-gray">
            Ejecutar Operacion
          </h2>

          {/* Player selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-bbva-gray mb-1.5">
                Jugador A
              </label>
              <select
                value={playerAId}
                onChange={(e) => { setPlayerAId(e.target.value); setSelectedOp(null); }}
                className="input-glass w-full rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="">Seleccionar...</option>
                {state.players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.secretNumber != null ? ` (${p.secretNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-bbva-gray mb-1.5">
                Jugador B
              </label>
              <select
                value={playerBId}
                onChange={(e) => { setPlayerBId(e.target.value); setSelectedOp(null); }}
                className="input-glass w-full rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="">Seleccionar...</option>
                {state.players.filter((p) => p.id !== playerAId).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.secretNumber != null ? ` (${p.secretNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Operations */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-bbva-gray mb-2">
              Operacion
            </label>
            <div className="flex gap-2">
              {([Operation.ADD, Operation.MULTIPLY, Operation.DIVIDE, Operation.ZERO_CARD] as Operation[]).map((op) => {
                const available = availableOps.includes(op);
                const selected = selectedOp === op;
                return (
                  <button
                    key={op}
                    onClick={() => available && setSelectedOp(op)}
                    disabled={!available}
                    className={`w-14 h-14 rounded-xl text-xl font-mono font-bold transition-all duration-200 cursor-pointer
                      ${selected
                        ? 'bg-bbva-aqua/20 text-bbva-aqua border border-bbva-aqua/40 glow-aqua scale-105'
                        : available
                          ? 'glass hover:bg-bbva-blue/40 text-bbva-white/70'
                          : 'bg-bbva-navy-light/50 text-bbva-gray/30 cursor-not-allowed'
                      }
                    `}
                  >
                    {OP_LABELS[op]}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-bbva-danger/10 border border-bbva-danger/20 text-bbva-danger text-sm animate-fade-in">
              {error}
            </div>
          )}

          <button
            onClick={handleExecute}
            disabled={!playerAId || !playerBId || !selectedOp}
            className="btn-primary w-full py-3 rounded-xl text-sm font-display"
          >
            Ejecutar
          </button>

          {/* Last result */}
          {lastResult !== null && (
            <div className="glass rounded-xl p-5 text-center glow-amber animate-count-up">
              <p className="text-[10px] font-mono uppercase tracking-widest text-bbva-gray mb-1">
                Ultimo resultado
              </p>
              <p className="text-4xl font-mono font-bold text-bbva-warning text-glow-amber">
                {lastResult}
              </p>
            </div>
          )}

          {/* Player submission status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-bbva-gray">
                Respuestas
              </h3>
              <span className="font-mono text-xs text-bbva-success/70">
                {submittedCount}/{state.players.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {state.players.map((p) => (
                <span
                  key={p.id}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-300
                    ${p.submitted
                      ? 'bg-bbva-success/15 text-bbva-success border border-bbva-success/20'
                      : 'glass text-bbva-gray'
                    }
                    ${!p.connected ? 'opacity-40' : ''}
                  `}
                >
                  {p.name}
                  <span className="ml-1 font-mono text-[10px] text-bbva-warning/70">{p.coins ?? 4}m</span>
                </span>
              ))}
            </div>
          </div>

          {/* End game */}
          <button
            onClick={handleEndGame}
            className="btn-danger w-full py-3 rounded-xl text-sm font-display"
          >
            Cerrar Ronda
          </button>
        </div>

        {/* Right panel: move history */}
        <div className="w-1/2 p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-bbva-gray">
              Historial
            </h2>
            <span className="font-mono text-xs text-bbva-gray/50">
              {state.moves.length}
            </span>
          </div>

          {state.moves.length === 0 ? (
            <div className="glass rounded-xl px-6 py-8 text-center">
              <p className="text-bbva-gray text-sm">Sin operaciones aun</p>
            </div>
          ) : (
            <ul className="space-y-2 stagger-children">
              {[...state.moves].reverse().map((m) => (
                <li key={m.id} className="glass rounded-xl px-4 py-3 animate-slide-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      <span className="font-medium text-bbva-white/80">{m.playerAName}</span>
                      <span className={`mx-2 font-mono font-bold text-lg ${OP_CLASSES[m.operation]}`}>
                        {OP_LABELS[m.operation]}
                      </span>
                      <span className="font-medium text-bbva-white/80">{m.playerBName}</span>
                    </span>
                    <span className="font-mono text-xl font-bold text-bbva-warning">
                      = {m.result}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
