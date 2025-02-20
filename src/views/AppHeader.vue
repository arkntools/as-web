<template>
  <div class="menu-bar">
    <MenuBar :config="menuConfig">
      <template #right>
        <el-button class="github-btn" :icon="IconGithub" circle text @click="gotoGithub" />
      </template>
    </MenuBar>
    <ExportOptionsDialog ref="exportOptionsDialogRef" />
    <UnityCNOptionsDialog ref="unityCNOptionsDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { useFileDialog } from '@vueuse/core';
import IElSelect from '~icons/ep/select';
import IconGithub from '@/assets/github.svg';
import MenuBar from '@/components/MenuBar.vue';
import type { MenuBarConfig } from '@/components/MenuBar.vue';
import { useAssetManager } from '@/store/assetManager';
import { useSetting } from '@/store/setting';
import ExportOptionsDialog from './components/ExportOptionsDialog.vue';
import UnityCNOptionsDialog from './components/UnityCNOptionsDialog.vue';

const emits = defineEmits<{
  (name: 'commandExport', type: string): any;
}>();

const assetManager = useAssetManager();
const setting = useSetting();

const exportOptionsDialogRef = ref<InstanceType<typeof ExportOptionsDialog>>();
const unityCNOptionsDialogRef = ref<InstanceType<typeof UnityCNOptionsDialog>>();

const gotoGithub = () => {
  window.open('https://github.com/arkntools/as-web', '_blank');
};

const loadFiles = (list: FileList | null) => {
  if (!list || !list.length) return;
  assetManager.loadFiles([...list]);
};

const { open: openFile, onChange: onFileChange } = useFileDialog({ reset: true });
onFileChange(loadFiles);

const { open: openFolder, onChange: onFolderChange } = useFileDialog({ directory: true, reset: true });
onFolderChange(loadFiles);

const menuConfig = markRaw<MenuBarConfig>([
  {
    name: 'File',
    items: [
      {
        name: 'Load file',
        handler: openFile,
        disabled: () => assetManager.isLoading,
      },
      {
        name: 'Load folder',
        handler: openFolder,
        disabled: () => assetManager.isLoading,
      },
    ],
  },
  {
    name: 'Options',
    icon: true,
    items: [
      {
        name: 'Enable preview',
        handler: () => {
          setting.data.enablePreview = !setting.data.enablePreview;
        },
        icon: () => (setting.data.enablePreview ? IElSelect : undefined),
      },
      {
        name: 'Export options',
        divided: true,
        handler: () => {
          exportOptionsDialogRef.value?.open();
        },
      },
      {
        name: 'UnityCN options',
        handler: () => {
          unityCNOptionsDialogRef.value?.open();
        },
      },
    ],
  },
  {
    name: 'Export',
    items: [
      {
        name: 'All assets',
        handler: () => emits('commandExport', 'all'),
        disabled: () => !assetManager.assetInfos.length,
      },
      {
        name: 'Filtered assets',
        handler: () => emits('commandExport', 'filtered'),
        disabled: () => !assetManager.assetInfos.length,
      },
      {
        name: 'Selected assets',
        handler: () => emits('commandExport', 'selected'),
        disabled: () => !(assetManager.assetInfos.length && assetManager.curAssetInfo),
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

.github-btn {
  --el-fill-color-light: rgba(0, 0, 0, 0.1);
  --el-fill-color: rgba(0, 0, 0, 0.15);
  padding: 4px;
  font-size: 18px;
}
</style>
