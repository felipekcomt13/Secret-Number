import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from 'shared';

declare const __SERVER_URL__: string;

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const serverUrl = typeof __SERVER_URL__ !== 'undefined' ? __SERVER_URL__ : '';

export const socket: AppSocket = io(serverUrl, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});
