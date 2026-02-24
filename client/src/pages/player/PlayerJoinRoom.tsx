import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useGame } from '../../contexts/GameContext';

export default function PlayerJoinRoom() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { dispatch } = useGame();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    setError('');

    socket.emit('player:join-room', { code: code.toUpperCase(), name: name.trim() }, (res) => {
      setLoading(false);
      if (res.ok && res.playerId) {
        dispatch({ type: 'SET_ROOM', code: code.toUpperCase() });
        dispatch({ type: 'SET_PLAYER', playerId: res.playerId, playerName: name.trim() });
        navigate('/play/lobby');
      } else {
        setError(res.error ?? 'Error al unirse');
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-4 md:px-6">
      <div className="glass rounded-3xl p-6 md:p-10 max-w-sm w-full animate-scale-in border-gradient-cyan">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-bbva-aqua/10 border border-bbva-aqua/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl font-mono font-bold text-bbva-aqua">#</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-bbva-white mb-1">Unirse a Sala</h1>
          <p className="text-sm text-bbva-gray">Ingresa tu nombre y el codigo de la sala</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-bbva-gray mb-2">
              Tu nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              maxLength={20}
              className="input-glass w-full rounded-xl px-4 py-3.5 text-base font-display"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-bbva-gray mb-2">
              Codigo de sala
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={4}
              className="input-glass w-full rounded-xl px-4 py-3.5 text-2xl font-mono font-bold tracking-[0.4em] text-center text-bbva-aqua"
            />
          </div>

          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-bbva-danger/10 border border-bbva-danger/20 text-bbva-danger text-sm animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || code.length < 4}
            className="btn-primary w-full py-4 rounded-xl text-lg font-display"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
