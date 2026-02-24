import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import Header from '../../components/shared/Header';

export default function PlayerResults() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  const myScore = state.scores.find((s) => s.playerId === state.playerId);
  const myRank = state.scores.findIndex((s) => s.playerId === state.playerId) + 1;

  return (
    <div className="flex flex-col min-h-dvh">
      <Header title="Resultados" roomCode={state.roomCode} />

      <div className="flex-1 px-4 md:px-6 py-6 md:py-8">
        {/* Personal score hero */}
        {myScore && (
          <div className="relative glass rounded-2xl p-5 md:p-8 mb-6 md:mb-8 text-center overflow-hidden glow-violet animate-scale-in">
            {/* Background accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-bbva-core-blue/15 via-transparent to-bbva-aqua/5 pointer-events-none" />

            <div className="relative">
              <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-bbva-gray mb-2">
                Tu puntaje
              </p>
              <p className="text-5xl md:text-6xl font-mono font-bold text-bbva-white text-glow-aqua mb-2 animate-count-up">
                {myScore.score}
              </p>
              <p className="text-sm text-bbva-gray">
                Puesto <span className="text-bbva-aqua font-semibold">#{myRank}</span> de {state.scores.length}
              </p>

              {/* Score breakdown */}
              <div className="flex flex-wrap justify-center gap-4 mt-5 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${myScore.selfCorrect ? 'bg-bbva-aqua' : 'bg-bbva-danger'}`} />
                  <span className="text-bbva-white/60">Mi num: {myScore.selfPoints > 0 ? '+' : ''}{myScore.selfPoints}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-bbva-success" />
                  <span className="text-bbva-white/60">Otros: {myScore.othersPoints > 0 ? '+' : ''}{myScore.othersPoints}</span>
                </span>
                {myScore.guessedByOthers > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-bbva-danger" />
                    <span className="text-bbva-white/60">Descubierto: -{myScore.guessedByPenalty}</span>
                  </span>
                )}
                {myScore.betCorrect != null && (
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${myScore.betCorrect ? 'bg-bbva-warning' : 'bg-bbva-danger'}`} />
                    <span className="text-bbva-white/60">Apuesta: {myScore.betPoints > 0 ? '+' : ''}{myScore.betPoints}</span>
                  </span>
                )}
                {myScore.sacrificePenalty > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-bbva-danger" />
                    <span className="text-bbva-white/60">Sacrificio: -{myScore.sacrificePenalty}</span>
                  </span>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-bbva-core-blue/15">
                <p className="text-xs text-bbva-gray">Tu numero secreto era</p>
                <p className="font-mono text-2xl font-bold text-bbva-warning text-glow-amber mt-1">
                  {myScore.secretNumber}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xs font-mono uppercase tracking-widest text-bbva-gray mb-3">
            Tabla General
          </h2>
          <div className="space-y-2 stagger-children">
            {state.scores.map((s, i) => {
              const isMe = s.playerId === state.playerId;
              return (
                <div
                  key={s.playerId}
                  className={`glass rounded-xl px-4 py-3.5 flex items-center justify-between animate-fade-up transition-all
                    ${isMe ? 'glow-violet border border-bbva-aqua/20 bg-bbva-aqua/[0.06]' : ''}
                    ${i === 0 && !isMe ? 'bg-bbva-warning/[0.05]' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-sm w-6 text-right ${
                      i === 0 ? 'text-bbva-warning font-bold' : 'text-bbva-gray/50'
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`font-medium ${isMe ? 'text-bbva-aqua' : 'text-bbva-white/80'}`}>
                      {s.playerName}
                      {isMe && <span className="text-bbva-gray text-xs ml-1.5">(tu)</span>}
                    </span>
                    <span className="font-mono text-xs text-bbva-warning/60">
                      ({s.secretNumber})
                    </span>
                  </div>
                  <span className="font-mono text-lg font-bold text-bbva-white">{s.score}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Back button */}
        <div className="mt-10 text-center animate-fade-up" style={{ animationDelay: '500ms' }}>
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
