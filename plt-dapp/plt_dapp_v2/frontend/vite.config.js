import { defineConfig } from 'vite';
import { resolve } from 'path'; // 👈 add this

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
  server: {
    host: true, // listen on all network interfaces
    port: 5173, // optional
    allowedHosts: ['potlock.loca.lt'],
  },
});
