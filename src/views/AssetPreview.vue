<template>
  <el-tabs v-model="activePane" class="asset-preview" type="border-card">
    <el-tab-pane class="asset-preview-pane" label="Preview" name="preview">
      <template v-if="activePane === 'preview'">
        <AssetImageViewer
          v-if="isImageAsset(store.curAssetInfo)"
          :asset="store.curAssetInfo"
          @load-image="store.loadImage"
        />
        <AssetNoPreview v-else />
      </template>
    </el-tab-pane>
    <el-tab-pane class="asset-preview-pane" label="Dump" name="dump">
      <template v-if="activePane === 'dump'">
        <AssetDumpViewer
          v-if="store.curAssetInfo"
          :asset="store.curAssetInfo"
          @goto-asset="pathId => emits('gotoAsset', pathId)"
        />
        <AssetNoPreview v-else />
      </template>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import AssetDumpViewer from '@/components/AssetDumpViewer.vue';
import AssetImageViewer from '@/components/AssetImageViewer.vue';
import AssetNoPreview from '@/components/AssetNoPreview.vue';
import { useAssetManager } from '@/store/assetManager';
import type { AssetInfo } from '@/workers/assetManager';

const emits = defineEmits<{
  (e: 'gotoAsset', pathId: bigint): void;
}>();

const store = useAssetManager();

const activePane = ref('preview');

const imageAssetTypes = new Set(['Sprite', 'Texture2D']);
const isImageAsset = (info: AssetInfo | undefined): info is AssetInfo => imageAssetTypes.has(info?.type as any);
</script>

<style lang="scss" scoped>
.asset-preview {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  &-pane {
    width: 100%;
    height: 100%;
  }

  :deep(.el-tabs__content) {
    padding: 0;
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 0;
  }
}
</style>
