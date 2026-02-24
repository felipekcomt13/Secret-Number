import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useGame } from '../../contexts/GameContext';

export default function AdminCreateRoom() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { dispatch } = useGame();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = () => {
    setLoading(true);
    setError('');
    socket.emit('admin:create-room', { key }, (res) => {
      setLoading(false);
      if (res.ok && res.code) {
        dispatch({ type: 'SET_ROOM', code: res.code });
        navigate('/admin/lobby');
      } else {
        setError(res.error ?? 'Error al crear sala');
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-4 md:px-6">
      <div className="glass rounded-3xl p-6 md:p-10 max-w-sm w-full text-center animate-scale-in border-gradient-cyan">
        <div className="w-14 h-14 rounded-2xl bg-bbva-core-blue/15 border border-bbva-core-blue/25 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-mono font-bold text-bbva-core-blue">+</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-bbva-white mb-2">Crear Sala</h1>
        <p className="text-sm text-bbva-gray mb-8">
          Genera un codigo para que los jugadores se unan
        </p>

        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Clave de administrador"
          className="input-glass w-full px-4 py-3 rounded-xl text-center mb-4"
        />

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-bbva-danger/10 border border-bbva-danger/20 text-bbva-danger text-sm animate-fade-in">
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="btn-primary w-full py-4 rounded-xl text-lg font-display"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creando...
            </span>
          ) : (
            'Crear Sala'
          )}
        </button>
      </div>
    </div>
  );
}
