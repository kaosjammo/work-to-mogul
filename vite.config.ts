import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Don't run test copies inside Claude Code worktrees (they double the suite).
    exclude: [...configDefaults.exclude, '**/.claude/**'],
  },
})
