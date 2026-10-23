import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import path from "path"
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The API doesn't send CORS headers, so the browser can't call it from another
  // origin. In dev, requests under its path (/api/v1) go through this server instead.
  const { VITE_REACT_APP_API_URL } = loadEnv(mode, process.cwd(), "VITE_")
  const api = VITE_REACT_APP_API_URL ? new URL(VITE_REACT_APP_API_URL) : null
  const proxy = api
    ? { [api.pathname.replace(/\/$/, "")]: { target: api.origin, changeOrigin: true } }
    : undefined

  return {
    plugins: [
      tailwindcss(),
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: { proxy },
  }
})
