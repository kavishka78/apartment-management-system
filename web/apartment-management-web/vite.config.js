import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Maintenance tests live at the repository root but use this app's dependencies.
    dedupe: ['react', 'react-dom', 'vitest', '@testing-library/react'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}', '../../maintenance-tests/web/**/*.{test,spec}.{js,jsx}'],
  },
})
