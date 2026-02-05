import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../backend/static',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,  // Required for Docker file watching on Windows/Mac
    },
    proxy: {
      '/api': {
        target: 'http://nearby-app-backend-1:8000',  // Use explicit container name to avoid DNS collision
        changeOrigin: true,
      },
    },
  },
})
