import { resolve } from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import Vue from '@vitejs/plugin-vue';
import { VxeResolver } from '@vxecli/import-unplugin-vue-components';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import { comlink } from 'vite-plugin-comlink';

const pathSrc = resolve(__dirname, 'src');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    comlink(),
    Vue(),
    Components({
      dirs: [],
      resolvers: [
        IconsResolver({ enabledCollections: ['ep'] }),
        ElementPlusResolver(),
        VxeResolver({ libraryName: 'vxe-table', importStyle: true }),
      ],
      dts: resolve(pathSrc, 'components.d.ts'),
    }),
    Icons(),
  ],
  worker: {
    plugins: () => [comlink()],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
