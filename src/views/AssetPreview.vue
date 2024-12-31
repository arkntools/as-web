<template>
  <el-tabs v-model="activePane" class="asset-preview" type="border-card">
    <el-tab-pane label="Preview" name="preview" />
    <el-tab-pane label="Dump" name="dump" />
    <div class="asset-preview-pane">
      <KeepAlive :exclude="['AssetTextViewerAsync']">
        <component
          :is="PreviewComponent"
          :asset="assetManager.curAssetInfo"
          :desc="enablePreview ? undefined : 'Preview disabled'"
          @load-image="assetManager.loadImage"
          @goto-asset="(pathId: any) => emits('gotoAsset', pathId)"
        />
      </KeepAlive>
    </div>
  </el-tabs>
</template>

<script setup lang="ts">
import AssetDumpViewer from '@/components/AssetDumpViewer.vue';
import AssetImageViewer from '@/components/AssetImageViewer.vue';
import AssetNoPreview from '@/components/AssetNoPreview.vue';
import { useAssetManager } from '@/store/assetManager';
import { useSetting } from '@/store/setting';

const emits = defineEmits<{
  (e: 'gotoAsset', pathId: bigint): void;
}>();

const assetManager = useAssetManager();
const setting = useSetting();

const activePane = ref('preview');

const viewerMap: Record<string, Component | undefined> = {
  Sprite: AssetImageViewer,
  Texture2D: AssetImageViewer,
  TextAsset: (c => {
    c.name = 'AssetTextViewerAsync';
    return c;
  })(defineAsyncComponent(() => import('@/components/AssetTextViewer.vue'))),
};

const enablePreview = computed(() => setting.data.enablePreview);

const PreviewComponent = computed(() => {
  if (!assetManager.curAssetInfo) return AssetNoPreview;
  switch (activePane.value) {
    case 'preview':
      if (!enablePreview.value) return AssetNoPreview;
      return viewerMap[assetManager.curAssetInfo.type] || AssetDumpViewer;
    case 'dump':
      return AssetDumpViewer;
  }
  return AssetNoPreview;
});
</script>

<style lang="scss" scoped>
.asset-preview {
  --el-tabs-header-height: 36px;
  display: flex;
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

  :deep(.el-tab-pane) {
    display: none;
  }
}
</style>
