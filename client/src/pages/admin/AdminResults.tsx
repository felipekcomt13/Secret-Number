import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import Header from '../../components/shared/Header';

export default function AdminResults() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  return (
    <div className="flex flex-col min-h-dvh">
      <Header title="Resultados" roomCode={state.roomCode} />

      <div className="flex-1 px-3 md:px-6 py-6 md:py-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-6 md:mb-8 animate-fade-up">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-bbva-warning/50 mb-2">
            Final
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-bbva-white">
            Tabla de Puntajes
          </h2>
        </div>

        {/* Scoreboard */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '150ms' }}>
         <div className="overflow-x-auto">
          {/* Table header */}
          <div className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem_3rem_3rem_3rem_4rem] gap-1 px-4 py-3 border-b border-bbva-core-blue/15 text-[9px] font-mono uppercase tracking-widest text-bbva-gray min-w-[600px]">
            <span>#</span>
            <span>Jugador</span>
            <span className="text-center">Num</span>
            <span className="text-center text-bbva-aqua/60">Yo</span>
            <span className="text-center text-bbva-success/60">Otros</span>
            <span className="text-center text-bbva-danger/60">Desc</span>
            <span className="text-center text-bbva-warning/60">🎲</span>
            <span className="text-center text-bbva-danger/40">🔥</span>
            <span className="text-center text-bbva-gray/40">--</span>
            <span className="text-right">Pts</span>
          </div>

          {/* Rows */}
          <div className="stagger-children">
            {state.scores.map((s, i) => (
              <div
                key={s.playerId}
                className={`grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem_3rem_3rem_3rem_4rem] gap-1 px-4 py-3 items-center border-b border-bbva-core-blue/[0.08] animate-fade-up transition-colors min-w-[600px]
                  ${i === 0 ? 'bg-bbva-warning/[0.06]' : 'hover:bg-bbva-blue/20'}
                `}
              >
                <span className={`font-mono text-sm ${i === 0 ? 'text-bbva-warning font-bold' : 'text-bbva-gray/50'}`}>
                  {i + 1}
                </span>
                <span className="font-medium text-bbva-white/90 flex items-center gap-1.5 text-sm truncate">
                  {i === 0 && <span className="text-bbva-warning text-xs">&#9733;</span>}
                  {s.playerName}
                </span>
                <span className="font-mono text-center text-bbva-warning/80 text-sm">{s.secretNumber}</span>
                <span className={`font-mono text-center text-sm ${s.selfPoints > 0 ? 'text-bbva-aqua' : s.selfPoints < 0 ? 'text-bbva-danger' : 'text-bbva-gray/30'}`}>
                  {s.selfPoints > 0 ? `+${s.selfPoints}` : s.selfPoints}
                </span>
                <span className={`font-mono text-center text-sm ${s.othersPoints > 0 ? 'text-bbva-success' : s.othersPoints < 0 ? 'text-bbva-danger' : 'text-bbva-gray/30'}`}>
                  {s.othersPoints > 0 ? `+${s.othersPoints}` : s.othersPoints}
                </span>
                <span className={`font-mono text-center text-sm ${s.guessedByPenalty > 0 ? 'text-bbva-danger' : 'text-bbva-gray/30'}`}>
                  {s.guessedByPenalty > 0 ? `-${s.guessedByPenalty}` : '0'}
                </span>
                <span className={`font-mono text-center text-sm ${s.betPoints > 0 ? 'text-bbva-warning' : s.betPoints < 0 ? 'text-bbva-danger' : 'text-bbva-gray/30'}`}>
                  {s.betCorrect == null ? '-' : s.betPoints > 0 ? `+${s.betPoints}` : s.betPoints}
                </span>
                <span className="font-mono text-center text-bbva-danger/60 text-sm">
                  {s.sacrificePenalty > 0 ? `-${s.sacrificePenalty}` : '-'}
                </span>
                <span className="font-mono text-center text-bbva-gray/40 text-sm">{s.othersBlank}</span>
                <span className="font-mono text-right text-lg font-bold text-bbva-white">{s.score}</span>
              </div>
            ))}
          </div>
         </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-bbva-gray/50 font-mono animate-fade-up" style={{ animationDelay: '300ms' }}>
          <span><span className="text-bbva-aqua/60">Yo</span> = mi número (±5)</span>
          <span><span className="text-bbva-success/60">Otros</span> = otros números (±1)</span>
          <span><span className="text-bbva-danger/60">Desc</span> = descubierto (-2 c/u)</span>
          <span>🎲 = apuesta (±2)</span>
          <span>🔥 = sacrificio (-3)</span>
        </div>

        {/* Back button */}
        <div className="mt-10 text-center animate-fade-up" style={{ animationDelay: '400ms' }}>
          <button
            onClick={() => {
              dispatch({ type: 'RESET' });
              navigate('/');
            }}
            className="btn-secondary px-8 py-3 rounded-xl font-display"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
