import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Needed for Docker to expose the port
    watch: {
      usePolling: true, // Ensures file changes are detected on Windows/Docker volumes
    },
    proxy: {
      '/api': {
        // In Docker, the backend is available at http://backend:8080
        // In local, it's http://localhost:8080
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
