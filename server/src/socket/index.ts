import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { ClientToServerEvents, ServerToClientEvents } from 'shared';
import { registerAdminHandlers } from './adminHandlers';
import { registerPlayerHandlers } from './playerHandlers';
import { registerConnectionHandlers } from './connectionHandlers';

export function setupSocket(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id}`);
    registerAdminHandlers(io, socket);
    registerPlayerHandlers(io, socket);
    registerConnectionHandlers(io, socket);
  });

  return io;
}
