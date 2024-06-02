import { URL, fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { VxeResolver } from '@vxecli/import-unplugin-vue-components';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import { comlink } from 'vite-plugin-comlink';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    comlink(),
    vue(),
    components({
      dts: false,
      dirs: [],
      resolvers: [ElementPlusResolver(), VxeResolver({ libraryName: 'vxe-table', importStyle: true })],
    }),
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
