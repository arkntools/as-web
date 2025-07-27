<template>
  <el-empty :description="desc" style="height: 100%" />
</template>

<script setup lang="ts">
const { desc = 'No preview' } = defineProps<{
  asset: any;
  data: string | null;
  desc?: string;
}>();
</script>
