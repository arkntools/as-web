<template>
  <el-tabs class="asset-preview" type="border-card">
    <el-tab-pane class="asset-preview-pane" label="Preview" lazy>
      <AssetImageViewer
        v-if="isImageAsset(store.curAssetInfo)"
        :asset="store.curAssetInfo"
        :load-asset="store.loadImage"
      />
      <el-empty v-else description="No preview" style="height: 100%" />
    </el-tab-pane>
    <el-tab-pane class="asset-preview-pane" label="Dump" lazy>Dump</el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import AssetImageViewer from '@/components/AssetImageViewer.vue';
import { useAssetManager } from '@/store/assetManager';
import type { AssetInfo } from '@/workers/assetManager';

const store = useAssetManager();

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
