<template>
  <div class="menu-bar">
    <MenuBar :config="menuConfig" />
  </div>
</template>

<script setup lang="ts">
import { useFileDialog } from '@vueuse/core';
import MenuBar, { type MenuBarConfig } from '@/components/MenuBar.vue';
import { useAssetManager } from '@/store/assetManager';

const store = useAssetManager();

const loadFiles = (list: FileList | null) => {
  if (!list || !list.length) return;
  store.loadFiles([...list]);
};

const { open: openFile, onChange: onFileChange } = useFileDialog({ reset: true });
onFileChange(loadFiles);

const { open: openFolder, onChange: onFolderChange } = useFileDialog({ directory: true, reset: true });
onFolderChange(loadFiles);

const menuConfig: MenuBarConfig = markRaw([
  {
    name: 'File',
    items: [
      {
        name: 'Load file',
        handler: openFile,
        disabled: () => store.isLoading,
      },
      {
        name: 'Load folder',
        handler: openFolder,
        disabled: () => store.isLoading,
      },
    ],
  },
]);
</script>

<style lang="scss" scoped>
.menu-btn {
  border: none;
  border-radius: 0;
  outline: none;
}
</style>
