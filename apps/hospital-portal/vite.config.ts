/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import path from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/hospital-portal',
  resolve: {
    alias: {
      '@wyecare/frontend': path.resolve(__dirname, './src'),
      '@': path.resolve(__dirname, './src'),
      '@wyecare-monorepo/shared-types': path.resolve(
        __dirname,
        '../../libs/shared/types/src/index.ts'
      ),
      '@wyecare-monorepo/web-ui': path.resolve(
        __dirname,
        '../../libs/web/ui/src/index.ts'
      ),
    },
  },

  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../../dist/apps/hospital-portal',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
