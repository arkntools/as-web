<template>
  <div class="asset-image-viewer transparent-gird">
    <el-image
      class="image"
      :src="src === null ? undefined : src || PNG_1PX"
      :infinite="false"
      :preview-src-list="src ? [src] : []"
      preview-teleported
      hide-on-click-modal
      fit="scale-down"
      @load="handleLoad"
    />
    <div v-if="imageInfo" class="image-info">
      <el-text size="large">{{ imageInfo }}</el-text>
    </div>
    <div v-if="src === undefined" v-loading="true" class="loading"></div>
  </div>
</template>

<script setup lang="ts">
import type { AssetInfo } from '@/workers/assetManager';

const props = defineProps<{
  asset: AssetInfo;
}>();

const emits = defineEmits<{
  (e: 'loadImage', asset: AssetInfo): void;
}>();

const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAAtJREFUGFdjYAACAAAFAAGq1chRAAAAAElFTkSuQmCC';

const src = computed(() => props.asset.data);

const imageInfo = ref('');

const handleLoad = (e: Event) => {
  const img = e.target as HTMLImageElement;
  if (!img.src?.startsWith('blob:')) return;
  imageInfo.value = `${img.naturalWidth}×${img.naturalHeight}`;
};

watch(
  () => props.asset,
  asset => {
    if (!asset) return;
    imageInfo.value = '';
    if (asset.data === undefined) {
      emits('loadImage', asset);
    }
  },
  { immediate: true },
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

.image-info {
  position: absolute;
  top: 0;
  left: 0;
  margin-left: 4px;
  pointer-events: none;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  animation: delayIn 0.3s forwards;

  :deep(.el-loading-mask) {
    background-color: transparent;
  }
}

@keyframes delayIn {
  0% {
    visibility: hidden;
  }
  99% {
    visibility: hidden;
  }
  100% {
    visibility: visible;
  }
}
</style>
