import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useGame } from '../../contexts/GameContext';
import Header from '../../components/shared/Header';

export default function AdminLobby() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useGame();

  useEffect(() => {
    socket.on('room:player-joined', (data) => {
      dispatch({ type: 'ADD_PLAYER', player: data.player, players: data.players });
    });

    socket.on('game:started', (data) => {
      dispatch({ type: 'GAME_STARTED', players: data.players });
      navigate('/admin/game');
    });

    return () => {
      socket.off('room:player-joined');
      socket.off('game:started');
    };
  }, [socket, dispatch, navigate]);

  const handleStart = () => {
    if (!state.roomCode) return;
    socket.emit('admin:start-game', { code: state.roomCode }, (res) => {
      if (!res.ok) alert(res.error);
    });
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <Header title="Lobby" roomCode={state.roomCode} />

      <div className="flex flex-col items-center flex-1 px-6 py-8">
        {/* Room code hero */}
        <div className="glass rounded-2xl px-10 py-8 mb-10 text-center glow-aqua animate-fade-up">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-bbva-aqua/50 mb-3">
            Codigo de Sala
          </p>
          <p className="font-mono text-5xl sm:text-6xl font-bold tracking-[0.35em] text-bbva-aqua text-glow-aqua">
            {state.roomCode}
          </p>
          <p className="mt-3 text-xs text-bbva-gray">
            Comparte este codigo con los jugadores
          </p>
        </div>

        {/* Player list */}
        <div className="w-full max-w-md mb-10 animate-fade-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-bbva-white/70 uppercase tracking-wider">
              Jugadores
            </h2>
            <span className="font-mono text-xs text-bbva-aqua/70 bg-bbva-aqua/8 px-2 py-0.5 rounded-md">
              {state.players.length}
            </span>
          </div>

          {state.players.length === 0 ? (
            <div className="glass rounded-xl px-6 py-8 text-center">
              <p className="text-bbva-gray text-sm animate-pulse-glow">
                Esperando jugadores...
              </p>
            </div>
          ) : (
            <ul className="space-y-2 stagger-children">
              {state.players.map((p) => (
                <li
                  key={p.id}
                  className="glass rounded-xl px-4 py-3 flex items-center gap-3 animate-slide-left"
                >
                  <span className="relative flex items-center justify-center w-3 h-3">
                    {p.connected && (
                      <span className="absolute inset-0 rounded-full bg-bbva-success/30 animate-ping" />
                    )}
                    <span
                      className={`relative w-2 h-2 rounded-full ${
                        p.connected ? 'bg-bbva-success' : 'bg-bbva-danger'
                      }`}
                    />
                  </span>
                  <span className="font-medium text-bbva-white/90">{p.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Start button */}
        <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
          <button
            onClick={handleStart}
            disabled={state.players.length < 2}
            className="btn-mint px-10 py-4 rounded-xl text-lg font-display"
          >
            Iniciar Partida
            <span className="ml-2 text-sm opacity-70">
              ({state.players.length} jugadores)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
