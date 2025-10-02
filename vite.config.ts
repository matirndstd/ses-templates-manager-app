import { coverageConfigDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), tailwindcss()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    testTimeout: 15000,
    coverage: {
      reporter: ['lcov'],
      exclude: [
        '**/src/components/ui/**',
        '**/tailwind.config.ts',
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
}));
