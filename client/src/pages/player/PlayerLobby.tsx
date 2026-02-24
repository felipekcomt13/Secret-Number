import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useGame } from '../../contexts/GameContext';
import Header from '../../components/shared/Header';

export default function PlayerLobby() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useGame();

  useEffect(() => {
    socket.on('room:player-joined', (data) => {
      dispatch({ type: 'ADD_PLAYER', player: data.player, players: data.players });
    });

    socket.on('game:started', (data) => {
      dispatch({ type: 'GAME_STARTED', players: data.players });
      navigate('/play/game');
    });

    return () => {
      socket.off('room:player-joined');
      socket.off('game:started');
    };
  }, [socket, dispatch, navigate]);

  return (
    <div className="flex flex-col min-h-dvh">
      <Header title="Sala de Espera" roomCode={state.roomCode} />

      <div className="flex flex-col items-center justify-center flex-1 px-6 py-8">
        {/* Waiting animation */}
        <div className="mb-10 text-center animate-fade-up">
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-bbva-aqua animate-pulse-glow"
                style={{ animationDelay: `${i * 300}ms` }}
              />
            ))}
          </div>
          <p className="text-lg text-bbva-white/60 mb-2">
            Esperando que el admin inicie la partida
          </p>
          <p className="text-sm text-bbva-gray">
            Jugando como{' '}
            <span className="text-bbva-aqua font-semibold">{state.playerName}</span>
          </p>
        </div>

        {/* Player badges */}
        {state.players.length > 0 && (
          <div className="w-full max-w-xs animate-fade-up" style={{ animationDelay: '200ms' }}>
            <p className="text-xs font-mono uppercase tracking-widest text-bbva-gray mb-3 text-center">
              {state.players.length} jugador(es) en la sala
            </p>
            <div className="flex flex-wrap justify-center gap-2 stagger-children">
              {state.players.map((p) => (
                <span
                  key={p.id}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium animate-scale-in ${
                    p.id === state.playerId
                      ? 'bg-bbva-aqua/15 text-bbva-aqua border border-bbva-aqua/20'
                      : 'glass text-bbva-white/60'
                  }`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
