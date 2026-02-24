import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import Header from '../../components/shared/Header';

export default function AdminResults() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  return (
    <div className="flex flex-col min-h-dvh">
      <Header title="Resultados" roomCode={state.roomCode} />

      <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8 animate-fade-up">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-bbva-warning/50 mb-2">
            Final
          </p>
          <h2 className="font-display text-3xl font-bold text-bbva-white">
            Tabla de Puntajes
          </h2>
        </div>

        {/* Scoreboard */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '150ms' }}>
          {/* Table header */}
          <div className="grid grid-cols-[2.5rem_1fr_4rem_3rem_3rem_3rem_4rem] gap-2 px-5 py-3 border-b border-bbva-core-blue/15 text-[10px] font-mono uppercase tracking-widest text-bbva-gray">
            <span>#</span>
            <span>Jugador</span>
            <span className="text-center">Num</span>
            <span className="text-center text-bbva-success/60">OK</span>
            <span className="text-center text-bbva-danger/60">Mal</span>
            <span className="text-center text-bbva-gray/40">--</span>
            <span className="text-right">Pts</span>
          </div>

          {/* Rows */}
          <div className="stagger-children">
            {state.scores.map((s, i) => (
              <div
                key={s.playerId}
                className={`grid grid-cols-[2.5rem_1fr_4rem_3rem_3rem_3rem_4rem] gap-2 px-5 py-3.5 items-center border-b border-bbva-core-blue/[0.08] animate-fade-up transition-colors
                  ${i === 0 ? 'bg-bbva-warning/[0.06]' : 'hover:bg-bbva-blue/20'}
                `}
              >
                <span className={`font-mono text-sm ${i === 0 ? 'text-bbva-warning font-bold' : 'text-bbva-gray/50'}`}>
                  {i + 1}
                </span>
                <span className="font-medium text-bbva-white/90 flex items-center gap-2">
                  {i === 0 && <span className="text-bbva-warning text-xs">&#9733;</span>}
                  {s.playerName}
                </span>
                <span className="font-mono text-center text-bbva-warning/80 text-sm">{s.secretNumber}</span>
                <span className="font-mono text-center text-bbva-success text-sm">{s.correct}</span>
                <span className="font-mono text-center text-bbva-danger text-sm">{s.incorrect}</span>
                <span className="font-mono text-center text-bbva-gray/40 text-sm">{s.blank}</span>
                <span className="font-mono text-right text-lg font-bold text-bbva-white">{s.score}</span>
              </div>
            ))}
          </div>
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
