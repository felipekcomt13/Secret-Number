import { spawn } from 'child_process';
import { existsSync, unlinkSync, readFileSync, watchFile, unwatchFile } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT_FILE = resolve(ROOT, '.server-port');

// Clean stale port file
if (existsSync(PORT_FILE)) unlinkSync(PORT_FILE);

// Start server
const server = spawn('npx', ['tsx', 'watch', 'src/index.ts'], {
  cwd: resolve(ROOT, 'server'),
  stdio: 'inherit',
  shell: true,
});

// Wait for server to write port file, then start client
function waitForPortFile() {
  return new Promise((res) => {
    const check = () => {
      if (existsSync(PORT_FILE)) {
        unwatchFile(PORT_FILE);
        const port = readFileSync(PORT_FILE, 'utf-8').trim();
        res(port);
        return true;
      }
      return false;
    };
    if (check()) return;
    watchFile(PORT_FILE, { interval: 200 }, () => check());
    // Fallback timeout
    setTimeout(() => { unwatchFile(PORT_FILE); res('3001'); }, 10000);
  });
}

const serverPort = await waitForPortFile();
console.log(`\nServer ready on port ${serverPort}, starting client...\n`);

const client = spawn('npx', ['vite'], {
  cwd: resolve(ROOT, 'client'),
  stdio: 'inherit',
  shell: true,
});

// Forward signals to kill both
function cleanup() {
  server.kill();
  client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
server.on('exit', cleanup);
client.on('exit', cleanup);
