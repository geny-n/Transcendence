import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  //for axios, does not connect because not the same domain (3100 != 1443)
  server: {
    proxy: {
      '/api/register': {
        target: 'https://localhost:1443',
        changeOrigin: true,
        // secure: false,
      }
    }
  }
})
