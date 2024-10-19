/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import * as path from 'node:path';
import { UserConfig } from 'vite'; // Import UserConfig

const config: UserConfig = {
  plugins: [react()],
  server: {
    host: true
  },
  publicDir: false,
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    environment: 'jsdom',
    setupFiles: './src/tests/setupTests.ts',
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(
        __dirname,
        "./src"
      )
    },
  },
  esbuild: {
    target: "esnext"
  }
}

export default defineConfig(config);
