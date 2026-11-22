import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  // Playwright specs live in e2e/ and run with `npm run test:e2e`
  test: { include: ['src/**/*.test.ts'] },
});
