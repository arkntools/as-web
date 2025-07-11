<template>
  <div class="image-viewer" :class="`bg-${bgType}`">
    <el-image
      class="image"
      :src="useSrc"
      :infinite="false"
      :preview-src-list="src ? [src] : []"
      preview-teleported
      hide-on-click-modal
      fit="scale-down"
      @load="handleLoad"
    />
    <div v-if="imageInfo" class="image-info">
      <el-text class="image-info-text" size="large">{{ imageInfo }}</el-text>
    </div>
    <el-dropdown class="bg-select" placement="bottom-end" trigger="click">
      <el-button class="bg-select-btn" type="primary" link
        >BG<el-icon><i-el-arrow-down /></el-icon
      ></el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="bgType = 'transparent'">Transparent</el-dropdown-item>
          <el-dropdown-item @click="bgType = 'black'">Black</el-dropdown-item>
          <el-dropdown-item @click="bgType = 'white'">White</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-button class="download-btn" type="info" @click="handleDownload"
      ><el-icon :size="20"><i-el-download /></el-icon
    ></el-button>
    <div v-if="src === undefined" v-loading="true" class="loading"></div>
  </div>
</template>

<script setup lang="ts">
import { saveAs } from 'file-saver';

const { src, name } = defineProps<{
  src?: string | null;
  name?: string;
}>();

const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAAtJREFUGFdjYAACAAAFAAGq1chRAAAAAElFTkSuQmCC';

const useSrc = computed(() => (src === null ? undefined : src || PNG_1PX));

const imageInfo = ref('');
const bgType = ref('transparent');

const handleLoad = (e: Event) => {
  const img = e.target as HTMLImageElement;
  imageInfo.value = !img.src || img.src === PNG_1PX ? '' : `${img.naturalWidth}×${img.naturalHeight}`;
};

const handleDownload = () => {
  if (src) {
    saveAs(src, `${name || 'image'}.png`);
  }
};
</script>

<style lang="scss" scoped>
.image-viewer {
  position: relative;
  width: 100%;
  height: 100%;

  :deep(.el-image__placeholder) {
    display: none;
  }
}

.bg-transparent {
  $size: 10px;
  $color: #e3e3e3;
  background-color: #fff;
  background-image:
    linear-gradient(45deg, $color 25%, transparent 25%), linear-gradient(-45deg, $color 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, $color 75%), linear-gradient(-45deg, transparent 75%, $color 75%);
  background-size: #{$size * 2} #{$size * 2};
  background-position:
    0 0,
    0 #{$size},
    #{$size} #{-$size},
    #{-$size} 0;
}

.bg-black {
  background-color: #000;

  .image-info-text {
    color: #fff;
  }
}

.bg-white {
  background-color: #fff;
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

.bg-select {
  position: absolute;
  top: 0;
  right: 0;

  &-btn {
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }
}

.download-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  padding: 0;
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
