<template>
  <TextViewerAsync :value />
</template>

<script setup lang="ts">
import TextViewerAsync from './TextViewerAsync';

const { data } = defineProps<{
  asset: any;
  data: string | null;
}>();

const value = computed(() => (typeof data === 'string' ? data : ''));
</script>
