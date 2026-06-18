import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build for older browsers too (e.g. Chrome 109 on Windows 7). Tailwind v3 +
// autoprefixer emit old-browser-friendly CSS; the JS is transpiled down to the
// chrome109 target so the admin panel works on legacy machines.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'chrome109',
    cssTarget: 'chrome109',
  },
})
