import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const demo = env.VITE_DEMO_MODE === 'true'
  return {
    plugins: [react()],
    // Demo build uses relative asset paths so it works from any sub-path
    // (e.g. https://<user>.github.io/<repo>/).
    base: demo ? './' : '/',
  }
})
