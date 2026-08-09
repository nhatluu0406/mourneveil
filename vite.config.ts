import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Windows Hyper-V / excluded port ranges often reserve 5141–5240 (includes Vite's
// default 5173), which surfaces as `listen EACCES ... ::1:5173`.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
})
