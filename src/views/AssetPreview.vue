<template>
  <el-tabs v-model="activePane" class="asset-preview" type="border-card">
    <el-tab-pane label="Preview" name="preview" />
    <el-tab-pane label="Type tree" name="typeTree" />
    <el-tab-pane label="Inspect" name="inspect" />
    <div class="asset-preview-pane">
      <KeepAlive :exclude="['AssetTextViewer', 'AssetTypeTreeViewer']">
        <component
          :is="PreviewComponent"
          :asset="assetManager.curAssetInfo!"
          :data="previewData"
          :desc="enablePreview ? undefined : 'Preview disabled'"
          @goto-asset="(pathId: any) => emits('gotoAsset', pathId)"
          @update-payload="(payload: any) => (previewPayload = payload)"
        />
      </KeepAlive>
    </div>
  </el-tabs>
</template>

<script setup lang="ts">
import { computedAsync } from '@vueuse/core';
import AssetAudioViewer from '@/components/AssetAudioViewer.vue';
import AssetImageViewer from '@/components/AssetImageViewer.vue';
import AssetDumpViewer from '@/components/AssetInspectViewer.vue';
import AssetNoPreview from '@/components/AssetNoPreview.vue';
import AssetSpineViewer from '@/components/AssetSpineViewerAsync';
import AssetTextViewer from '@/components/AssetTextViewer.vue';
import AssetTypeTreeViewer from '@/components/AssetTypeTreeViewer.vue';
import { useAssetManager } from '@/store/assetManager';
import { useSetting } from '@/store/setting';
import { PreviewType } from '@/types/preview';

const emits = defineEmits<{
  (e: 'gotoAsset', pathId: bigint): void;
}>();

const assetManager = useAssetManager();
const setting = useSetting();

const activePane = ref('preview');
const enablePreview = computed(() => setting.data.enablePreview);

const previewPayload = shallowRef<any>();
const previewDataLoading = ref(false);

watch(
  () => assetManager.curAssetInfo,
  () => {
    previewPayload.value = undefined;
    previewDataLoading.value = true;
  },
  { flush: 'sync' },
);

const previewDataAsync = computedAsync(
  async () => {
    if (!enablePreview.value) return null;
    const info = assetManager.curAssetInfo;
    if (!info) return null;
    const {
      fileId,
      pathId,
      preview: { type },
    } = info;
    if (type === PreviewType.None || (type === PreviewType.ImageList && !previewPayload.value)) return null;
    const data = await assetManager.loadPreviewData(
      { fileId, pathId },
      type === PreviewType.ImageList ? previewPayload.value : undefined,
    );
    return data ?? null;
  },
  null,
  {
    evaluating: previewDataLoading,
  },
);

const previewData = computed(() => (previewDataLoading.value ? null : previewDataAsync.value));

const PreviewComponent = computed(() => {
  const info = assetManager.curAssetInfo;
  if (!info) return AssetNoPreview;
  switch (activePane.value) {
    case 'preview': {
      switch (info.preview.type) {
        case PreviewType.Image:
        case PreviewType.ImageList:
          return AssetImageViewer;
        case PreviewType.Text:
          return AssetTextViewer;
        case PreviewType.Audio:
          return AssetAudioViewer;
        case PreviewType.Spine:
          return AssetSpineViewer;
        default:
          return AssetNoPreview;
      }
    }
    case 'typeTree':
      return AssetTypeTreeViewer;
    case 'inspect':
      return AssetDumpViewer;
    default:
      return AssetNoPreview;
  }
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
