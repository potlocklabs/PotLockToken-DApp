import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',   // ensures relative paths for assets
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        potlock: resolve(__dirname, 'potlock-info.html'),
      },
    },
  },
  optimizeDeps: {
    include: ['jquery'], // ensures jQuery is bundled for dev
  },
  server: {
    host: true, // listen on all network interfaces
    port: 5173, // optional
    allowedHosts: ['potlock.loca.lt'],
  },
});
