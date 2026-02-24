import { useSocket } from '../../contexts/SocketContext';

export default function Header({ title, roomCode, playerName }: { title: string; roomCode?: string | null; playerName?: string | null }) {
  const { connected } = useSocket();

  return (
    <header className="bg-bbva-blue flex items-center justify-between px-3 md:px-5 py-3 md:py-3.5 border-b border-bbva-core-blue/15">
      <h1 className="font-display text-sm font-semibold tracking-wide uppercase text-bbva-white/80 shrink-0">
        {title}
      </h1>
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {roomCode && (
          <span className="font-mono text-[10px] md:text-xs font-medium text-bbva-aqua bg-bbva-aqua/10 border border-bbva-aqua/20 px-2 md:px-2.5 py-1 rounded-md tracking-widest truncate max-w-[180px] md:max-w-none">
            {roomCode}{playerName ? ` — ${playerName}` : ''}
          </span>
        )}
        <span className="relative flex items-center justify-center w-3 h-3">
          {connected && (
            <span className="absolute inset-0 rounded-full bg-bbva-success/40 animate-ping" />
          )}
          <span
            className={`relative w-2 h-2 rounded-full ${
              connected ? 'bg-bbva-success' : 'bg-bbva-danger'
            }`}
          />
        </span>
      </div>
    </header>
  );
}
