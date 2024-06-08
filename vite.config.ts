import { resolve } from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import Vue from '@vitejs/plugin-vue';
import { VxeResolver } from '@vxecli/import-unplugin-vue-components';
import AutoImport from 'unplugin-auto-import/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import { comlink } from 'vite-plugin-comlink';

const pathSrc = resolve(__dirname, 'src');

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    comlink(),
    Vue(),
    AutoImport({
      imports: ['vue'],
      dirs: [],
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
      vueTemplate: true,
      dts: command === 'serve' ? resolve(pathSrc, 'auto-imports.d.ts') : false,
      eslintrc: {
        enabled: false,
        filepath: resolve(__dirname, 'eslint.config.autoImport.json'),
        globalsPropValue: 'readonly',
      },
    }),
    Components({
      dirs: [],
      resolvers: [
        IconsResolver({ enabledCollections: ['ep'], alias: { el: 'ep' } }),
        ElementPlusResolver({ importStyle: 'sass' }),
        VxeResolver({ libraryName: 'vxe-table', importStyle: true }),
      ],
      dts: command === 'serve' ? resolve(pathSrc, 'components.d.ts') : false,
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
}));
