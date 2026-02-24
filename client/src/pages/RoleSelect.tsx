import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { dispatch } = useGame();

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12">
      {/* Decorative floating numbers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        <span className="absolute top-[12%] left-[8%] text-8xl font-mono font-bold text-bbva-core-blue/[0.07] animate-float">7</span>
        <span className="absolute top-[20%] right-[12%] text-7xl font-mono font-bold text-bbva-core-blue/[0.07] animate-float" style={{ animationDelay: '1s' }}>3</span>
        <span className="absolute bottom-[18%] left-[15%] text-9xl font-mono font-bold text-bbva-core-blue/[0.07] animate-float" style={{ animationDelay: '0.5s' }}>42</span>
        <span className="absolute bottom-[25%] right-[8%] text-8xl font-mono font-bold text-bbva-core-blue/[0.07] animate-float" style={{ animationDelay: '1.5s' }}>?</span>
      </div>

      {/* Title block */}
      <div className="relative animate-fade-up mb-16 text-center">
        <p className="font-mono text-xs tracking-[0.4em] uppercase text-bbva-aqua/60 mb-4">
          Descifra el misterio
        </p>
        <h1 className="font-display text-6xl sm:text-7xl font-bold tracking-tight text-bbva-white leading-none">
          Secret
          <br />
          <span className="text-glow-aqua text-bbva-aqua">Number</span>
        </h1>
        <div className="mt-4 mx-auto w-16 h-px bg-gradient-to-r from-transparent via-bbva-aqua/50 to-transparent" />
      </div>

      {/* Role cards */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg animate-fade-up" style={{ animationDelay: '200ms' }}>
        <button
          onClick={() => {
            dispatch({ type: 'SET_ROLE', role: 'admin' });
            navigate('/admin');
          }}
          className="group relative flex-1 glass rounded-2xl p-8 text-left transition-all duration-300 hover:bg-bbva-blue/50 cursor-pointer border-gradient-cyan"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-bbva-core-blue/15 border border-bbva-core-blue/25 flex items-center justify-center text-bbva-core-blue text-lg font-mono font-bold">
              A
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-bbva-gray">Control</span>
          </div>
          <h2 className="text-xl font-semibold text-bbva-white mb-1 group-hover:text-bbva-aqua transition-colors">
            Administrador
          </h2>
          <p className="text-sm text-bbva-gray">
            Crea salas y controla las operaciones
          </p>
        </button>

        <button
          onClick={() => {
            dispatch({ type: 'SET_ROLE', role: 'player' });
            navigate('/play');
          }}
          className="group relative flex-1 glass rounded-2xl p-8 text-left transition-all duration-300 hover:bg-bbva-blue/50 cursor-pointer border-gradient-cyan"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-bbva-aqua/10 border border-bbva-aqua/20 flex items-center justify-center text-bbva-aqua text-lg font-mono font-bold">
              J
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-bbva-gray">Play</span>
          </div>
          <h2 className="text-xl font-semibold text-bbva-white mb-1 group-hover:text-bbva-aqua transition-colors">
            Jugador
          </h2>
          <p className="text-sm text-bbva-gray">
            Unete a una sala y adivina los numeros
          </p>
        </button>
      </div>
    </div>
  );
}
