import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    testTimeout: 10000, // 10 seconds timeout for individual tests
    hookTimeout: 10000, // 10 seconds timeout for hooks
    teardownTimeout: 10000, // 10 seconds timeout for teardown
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Run tests in single thread to avoid conflicts
      }
    },
    maxConcurrency: 5, // Limit concurrent tests
  },
});