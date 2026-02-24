import { createServer } from 'http';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { app } from './app';
import { setupSocket } from './socket';
import { SERVER_PORT } from 'shared';

const httpServer = createServer(app);
setupSocket(httpServer);

const PORT_FILE = join(__dirname, '..', '..', '.server-port');

function listen(port: number) {
  httpServer.listen(port)
    .on('listening', () => {
      writeFileSync(PORT_FILE, String(port));
      console.log(`Server running on http://localhost:${port}`);
    })
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} in use, trying ${port + 1}...`);
        listen(port + 1);
      } else {
        throw err;
      }
    });
}

listen(Number(process.env.PORT) || SERVER_PORT);
