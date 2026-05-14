/// <reference types="vitest/config" />

import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    typecheck: {
      enabled: true,
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/*.d.ts'],
    },
  },
});
