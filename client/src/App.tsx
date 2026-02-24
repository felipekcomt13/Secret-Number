import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { GameProvider } from './contexts/GameContext';
import RoleSelect from './pages/RoleSelect';
import AdminCreateRoom from './pages/admin/AdminCreateRoom';
import AdminLobby from './pages/admin/AdminLobby';
import AdminGameBoard from './pages/admin/AdminGameBoard';
import AdminResults from './pages/admin/AdminResults';
import PlayerJoinRoom from './pages/player/PlayerJoinRoom';
import PlayerLobby from './pages/player/PlayerLobby';
import PlayerGame from './pages/player/PlayerGame';
import PlayerResults from './pages/player/PlayerResults';

export default function App() {
  return (
    <SocketProvider>
      <GameProvider>
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
