import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: relativo, così l'app funziona sia su GitHub Pages (in sottocartella)
// sia aperta da un server statico qualsiasi.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist' },
})
