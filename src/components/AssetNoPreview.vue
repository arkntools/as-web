<template>
  <el-empty :description="desc" style="height: 100%" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ desc: string }>(), { desc: 'No preview' });
</script>
