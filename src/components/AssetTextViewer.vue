<template>
  <TextViewerAsync :value />
</template>

<script setup lang="ts">
import { TextViewerAsync } from './TextViewer';

const { data } = defineProps<{
  asset: any;
  data: string | null;
}>();

const value = computed(() => (typeof data === 'string' ? data : ''));
</script>
