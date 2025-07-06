<template>
  <TextViewerAsync :data />
</template>

<script setup lang="ts">
import type { AssetInfo } from '@/workers/assetManager';
import TextViewerAsync from './TextViewerAsync';

const { asset } = defineProps<{
  asset: AssetInfo;
}>();

// @ts-ignore
const handleJsonBigint = (num: bigint) => JSON.rawJSON?.(num.toString()) ?? num.toString();

const data = computed(() =>
  JSON.stringify(asset.typeTree, (key, value) => (typeof value === 'bigint' ? handleJsonBigint(value) : value), 2),
);
</script>

<style></style>
