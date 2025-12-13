import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

const isDevelopment = process.env.NODE_ENV === 'development';
const INPUT = process.env.INPUT || 'widgets/quiz.html';

export default defineConfig({
  root: 'web/',
  plugins: [react(), viteSingleFile()],
  build: {
    sourcemap: isDevelopment ? 'inline' : undefined,
    cssMinify: !isDevelopment,
    minify: !isDevelopment,
    rollupOptions: {
      input: path.resolve(__dirname, 'web', INPUT),
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
});
