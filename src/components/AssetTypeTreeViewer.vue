<template>
  <TextViewerAsync :value />
</template>

<script setup lang="ts">
import type { AssetInfo } from '@/workers/assetManager';
import TextViewerAsync from './TextViewerAsync';

const { asset } = defineProps<{
  asset: AssetInfo;
  data: any;
}>();

// @ts-expect-error
const handleJsonBigint = (num: bigint) => JSON.rawJSON?.(num.toString()) ?? num.toString();

const value = computed(() =>
  JSON.stringify(
    asset.preview.typeTree,
    (key, value) => (typeof value === 'bigint' ? handleJsonBigint(value) : value),
    2,
  ),
);
</script>

<style></style>
