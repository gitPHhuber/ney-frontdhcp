import path from 'path';
import { execSync } from 'child_process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function resolveBuildInfo() {
  let commit = 'unknown';
  try {
    commit = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    console.warn('Unable to resolve git commit hash for build badge.', error);
  }

  return {
    commit,
    time: new Date().toISOString(),
  } as const;
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = env.API_KEY || env.LLM_API_KEY || '';
    const buildInfo = resolveBuildInfo();
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        __APP_BUILD_INFO__: JSON.stringify(buildInfo)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'node',
        exclude: ['tests/e2e/**', 'node_modules/**'],
      },
    };
});
