import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { RoomStatus } from 'shared';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import { GameProvider, useGame, getSavedSession } from './contexts/GameContext';
import RoleSelect from './pages/RoleSelect';
import AdminCreateRoom from './pages/admin/AdminCreateRoom';
import AdminLobby from './pages/admin/AdminLobby';
import AdminGameBoard from './pages/admin/AdminGameBoard';
import AdminResults from './pages/admin/AdminResults';
import PlayerJoinRoom from './pages/player/PlayerJoinRoom';
import PlayerLobby from './pages/player/PlayerLobby';
import PlayerGame from './pages/player/PlayerGame';
import PlayerResults from './pages/player/PlayerResults';

function Reconnector() {
  const { socket, connected } = useSocket();
  const { dispatch } = useGame();
  const navigate = useNavigate();
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!connected || attempted) return;
    setAttempted(true);

    const session = getSavedSession();
    if (!session) return;

    if (session.role === 'player' && session.playerId && session.playerName) {
      socket.emit('player:reconnect', { code: session.roomCode, playerId: session.playerId }, (res) => {
        if (res.ok && res.players && res.status) {
          dispatch({
            type: 'RESTORE_PLAYER_SESSION',
            roomCode: session.roomCode,
            playerId: session.playerId!,
            playerName: session.playerName!,
            players: res.players,
            moves: res.moves ?? [],
            guesses: res.guesses ?? {},
            submitted: res.submitted ?? false,
            betSubmitted: res.betSubmitted ?? false,
            sacrificesRemaining: res.sacrificesRemaining ?? 0,
            status: res.status,
          });
          if (res.status === RoomStatus.LOBBY) navigate('/play/lobby');
          else if (res.status === RoomStatus.PLAYING) navigate('/play/game');
          else navigate('/play/results');
        } else {
          // Session expired, clear storage
          sessionStorage.clear();
        }
      });
    } else if (session.role === 'admin') {
      socket.emit('admin:reconnect', { code: session.roomCode }, (res) => {
        if (res.ok && res.players && res.status) {
          dispatch({
            type: 'RESTORE_ADMIN_SESSION',
            roomCode: session.roomCode,
            players: res.players,
            moves: res.moves ?? [],
            sacrificesRemaining: res.sacrificesRemaining ?? 0,
            status: res.status,
            scores: res.scores,
          });
          if (res.status === RoomStatus.LOBBY) navigate('/admin/lobby');
          else if (res.status === RoomStatus.PLAYING) navigate('/admin/game');
          else navigate('/admin/results');
        } else {
          sessionStorage.clear();
        }
      });
    }
  }, [connected, attempted, socket, dispatch, navigate]);

  return null;
}

export default function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <Reconnector />
        <div className="min-h-dvh bg-bbva-navy text-bbva-white bg-dotgrid">
          <Routes>
            <Route path="/" element={<RoleSelect />} />
            <Route path="/admin" element={<AdminCreateRoom />} />
            <Route path="/admin/lobby" element={<AdminLobby />} />
            <Route path="/admin/game" element={<AdminGameBoard />} />
            <Route path="/admin/results" element={<AdminResults />} />
            <Route path="/play" element={<PlayerJoinRoom />} />
            <Route path="/play/lobby" element={<PlayerLobby />} />
            <Route path="/play/game" element={<PlayerGame />} />
            <Route path="/play/results" element={<PlayerResults />} />
          </Routes>
        </div>
      </GameProvider>
    </SocketProvider>
  );
}
