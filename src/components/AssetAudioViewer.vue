<template>
  <div class="asset-audio-viewer">
    <audio
      :src="data || ''"
      class="audio"
      controls
      :autoPlay="settings.autoPlay ? '' : null"
      :loop="settings.loop"
    ></audio>
    <div class="settings">
      <el-switch v-model="settings.autoPlay" class="setting-switch" active-text="Auto Play" />
      <el-switch v-model="settings.loop" class="setting-switch" active-text="Loop" />
    </div>
    <FullSizeLoading :loading="!data" />
  </div>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import FullSizeLoading from './FullSizeLoading.vue';

defineProps<{
  asset: any;
  data: string | null;
}>();

const settings = useLocalStorage(
  'asset-audio-viewer-settings',
  { autoPlay: false, loop: false },
  { mergeDefaults: true, writeDefaults: false },
);
</script>

<style lang="scss" scoped>
.asset-audio-viewer {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #808080;
}

.audio {
  width: 80%;
}

.settings {
  position: absolute;
  top: 8px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-switch :deep(.el-switch__label) {
  color: #fff !important;
}
</style>
