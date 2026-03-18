import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Base path must match your GitHub repo name for GitHub Pages
  base: '/group-interview-tool/',
  build: {
    outDir: 'dist',
  },
})
