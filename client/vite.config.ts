import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function getServerUrl(): string {
  if (process.env.VITE_SERVER_URL) {
    return process.env.VITE_SERVER_URL;
  }
  try {
    const portFile = resolve(__dirname, '..', '.server-port');
    const port = readFileSync(portFile, 'utf-8').trim();
    return `http://localhost:${port}`;
  } catch {
    return 'http://localhost:3001';
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      shared: resolve(__dirname, '../shared/src'),
    },
  },
  define: {
    __SERVER_URL__: JSON.stringify(getServerUrl()),
  },
});
