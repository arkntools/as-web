<template>
  <el-tabs class="asset-preview" type="border-card">
    <el-tab-pane class="asset-preview-pane" label="Preview" lazy>
      <AssetImageViewer :asset="store.curAssetInfo" :load-asset="store.loadImage" />
    </el-tab-pane>
    <el-tab-pane class="asset-preview-pane" label="Dump" lazy>Dump</el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import AssetImageViewer from '@/components/AssetImageViewer.vue';
import { useAssetManager } from '@/store/assetManager';

const store = useAssetManager();
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
