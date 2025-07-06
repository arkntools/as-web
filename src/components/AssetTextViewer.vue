<template>
  <TextViewerAsync :data />
</template>

<script setup lang="ts">
import TextViewerAsync from './TextViewerAsync';
import type { AssetInfo } from '@/workers/assetManager';

const props = defineProps<{
  asset: AssetInfo;
}>();

const data = computed(() => {
  const assetData = props.asset.data;
  return assetData?.type === 'text' ? assetData.data : '';
});
</script>
