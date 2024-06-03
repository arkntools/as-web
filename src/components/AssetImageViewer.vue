<template>
  <div v-if="props.asset" class="asset-image-viewer transparent-gird">
    <el-image
      class="image"
      :src="src === null ? undefined : src || PNG_1PX"
      :infinite="false"
      :preview-src-list="src ? [src] : []"
      preview-teleported
      fit="scale-down"
    />
  </div>
  <div v-else class="asset-image-viewer">
    <el-empty description="No preview" style="height: 100%" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { AssetInfo } from '@/workers/assetManager';

const props = defineProps<{
  asset?: AssetInfo;
  loadAsset?: (asset: AssetInfo) => any;
}>();

const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAAtJREFUGFdjYAACAAAFAAGq1chRAAAAAElFTkSuQmCC';

const src = computed(() => props.asset?.data);

watch(
  () => props.asset,
  asset => {
    if (!asset) return;
    if (asset.data === undefined) {
      props.loadAsset?.(asset);
    }
  },
);
</script>

<style lang="scss" scoped>
.asset-image-viewer {
  position: relative;
  width: 100%;
  height: 100%;

  :deep(.el-image__placeholder) {
    display: none;
  }
}

.transparent-gird {
  $size: 10px;
  $color: #e3e3e3;
  background-color: #fff;
  background-image: linear-gradient(45deg, $color 25%, transparent 25%),
    linear-gradient(-45deg, $color 25%, transparent 25%), linear-gradient(45deg, transparent 75%, $color 75%),
    linear-gradient(-45deg, transparent 75%, $color 75%);
  background-size: #{$size * 2} #{$size * 2};
  background-position:
    0 0,
    0 #{$size},
    #{$size} #{-$size},
    #{-$size} 0;
}

.image {
  width: 100%;
  height: 100%;

  :deep(img) {
    -webkit-user-drag: none;
  }
}
</style>
