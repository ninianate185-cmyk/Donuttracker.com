import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base + hash routing keep dist/ deployable on any static host.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  build: { outDir: 'dist', assetsDir: 'assets/build', emptyOutDir: true },
  server: { port: 4173, host: '127.0.0.1' },
  preview: { port: 4173, host: '127.0.0.1' },
})
