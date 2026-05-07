import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [
        projectRoot,
        'C:/Users/Cory/Documents/coding',
      ],
    },
  },
});
