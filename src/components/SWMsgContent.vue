<template>
  <div class="sw-actions">
    <el-button @click="emit('cancel')">Not now</el-button>
    <el-button type="primary" @click="emit('confirm')">Refresh</el-button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['cancel', 'confirm']);
</script>

<style lang="scss" scoped>
.sw-actions {
  margin-top: 16px;
  float: right;
}
</style>
