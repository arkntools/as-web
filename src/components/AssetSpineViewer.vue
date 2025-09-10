<template>
  <div class="asset-spine-viewer">
    <SpinePlayerAsync
      v-if="spine"
      :key="asset.pathId.toString()"
      v-bind="spine"
      v-model:scale="scale"
      :bg-color="bgColor"
    />
    <div class="control-wrapper">
      <el-color-picker
        v-model="bgColor"
        popper-class="player-bg-color-picker-popper"
        size="large"
        :show-alpha="true"
        color-format="hex"
        :predefine="['#00000000', '#ffffffff', '#000000ff', '#00ff00ff']"
      />
      <el-slider
        v-model="scale"
        class="scale-slider"
        vertical
        height="200px"
        :min="0.1"
        :max="1.9"
        :step="0.01"
        :show-tooltip="false"
        :marks="{ 1: '' }"
      />
      <el-button circle @click="scale = 1">
        <el-icon><i-el-full-screen /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AssetObject } from '@arkntools/unity-js';
import { useLocalStorage } from '@vueuse/core';
import { groupBy } from 'es-toolkit';
import { every } from 'es-toolkit/compat';
import type { SpineItem } from '@/workers/assetManager/utils/cache';
import { SpinePlayerAsync } from './SpinePlayer';

const { data } = defineProps<{
  asset: AssetObject;
  data: SpineItem<string>[] | null;
}>();

const bgColor = useLocalStorage('asset-spine-viewer-bg-color', '#00000000', { writeDefaults: false });
const scale = ref(1);

const spine = computed(() => {
  if (!data) return null;
  const { skel = [], atlas = [], image = [] } = groupBy(data, item => item.type);
  if (!every([skel, atlas, image], items => items.length)) return null;
  return {
    skel: skel[0].data,
    atlas: atlas[0].data,
    images: Object.fromEntries(image.map(({ name, data }) => [name, data])),
  };
});
</script>

<style lang="scss" scoped>
.asset-spine-viewer {
  width: 100%;
  height: 100%;
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

.control-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: absolute;
  top: 16px;
  right: 16px;

  :deep(.el-color-picker__trigger) {
    background-color: #fff;
  }

  .scale-slider {
    --el-slider-runway-bg-color: var(--el-color-primary);
  }
}
</style>

<style lang="scss">
.player-bg-color-picker-popper {
  .el-color-predefine__color-selector {
    margin-top: 6px;
    &.is-alpha > div {
      background-color: transparent !important;
    }
    &:not(.selected) {
      box-shadow: 0 0 3px 2px rgba(0, 0, 0, 0.12);
    }
  }
  .el-color-dropdown__btns {
    margin-top: 4px;
  }
}
</style>
