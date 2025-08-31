// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',   // 👈 ensures relative paths for assets
  server: {
    host: true, // This tells Vite to listen on all network interfaces
    port: 5173, // Optional: Explicitly set the port, though 5173 is default
    allowedHosts: ['potlock.loca.lt'],
  },
});