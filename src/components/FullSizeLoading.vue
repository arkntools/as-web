<template>
  <div v-if="loading" v-loading="true" class="loading"></div>
</template>

<script setup lang="ts">
defineProps<{
  loading?: boolean;
}>();
</script>

<style lang="scss" scoped>
.loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  animation: delayIn 0.3s forwards;

  :deep(.el-loading-mask) {
    background-color: transparent;
  }
}

@keyframes delayIn {
  0% {
    visibility: hidden;
  }
  99% {
    visibility: hidden;
  }
  100% {
    visibility: visible;
  }
}
</style>
