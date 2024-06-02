<template>
  <el-container>
    <el-header>Header</el-header>
    <el-container :style="{ minHeight: 0 }">
      <LazySplitpanes local-storage-key="asset-list-width" :default-left-width="60">
        <template #left>
          <AssetList />
        </template>
        <template #right>Main2</template>
      </LazySplitpanes>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import LazySplitpanes from './components/LazySplitpanes.vue';
import AssetList from './views/AssetList.vue';
</script>

<style lang="scss" scoped>
.main {
  padding: 0;
}
</style>
