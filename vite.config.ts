import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/comtrade': {
            target: 'https://comtradeapi.un.org',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/comtrade/, ''),
          },
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            manualChunks: {
              'firebase': ['firebase/firestore', 'firebase/auth', 'firebase/app'],
            },
          },
        },
      },
    };
});
