<template>
  <el-tabs v-model="activePane" class="asset-preview" type="border-card">
    <el-tab-pane label="Preview" name="preview" />
    <el-tab-pane label="Type tree" name="typeTree" />
    <el-tab-pane label="Dump" name="dump" />
    <div class="asset-preview-pane">
      <KeepAlive :exclude="['AssetTextViewer', 'AssetTypeTreeViewer']">
        <component
          :is="PreviewComponent"
          :asset="assetManager.curAssetInfo!"
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
import AssetTextViewer from '@/components/AssetTextViewer.vue';
import AssetTypeTreeViewer from '@/components/AssetTypeTreeViewer.vue';
import { useAssetManager } from '@/store/assetManager';
import { useSetting } from '@/store/setting';
import type { AssetInfoData } from '@/workers/assetManager';

const emits = defineEmits<{
  (e: 'gotoAsset', pathId: bigint): void;
}>();

const assetManager = useAssetManager();
const setting = useSetting();

const activePane = ref('preview');

const enablePreview = computed(() => setting.data.enablePreview);

const isTextData = (data: AssetInfoData) => data.type === 'text';
const isImageData = (data: AssetInfoData) => data.type === 'image' || (data.type === 'imageList' && !!data.list.length);

const PreviewComponent = computed(() => {
  const info = assetManager.curAssetInfo;
  if (!info) return AssetNoPreview;
  switch (activePane.value) {
    case 'preview':
      const data = info.data;
      if (!enablePreview.value || !data) return AssetNoPreview;
      if (isImageData(data)) return AssetImageViewer;
      if (isTextData(data)) return AssetTextViewer;
      return AssetNoPreview;
    case 'typeTree':
      return AssetTypeTreeViewer;
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
