<template>
  <el-container>
    <el-header>Header</el-header>
    <el-container :style="{ minHeight: 0 }">
      <LazySplitpanes local-storage-key="asset-list-width" :default-left-width="60">
        <template #left>
          <AssetList />
        </template>
        <template #right>
          <AssetPreview />
        </template>
      </LazySplitpanes>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import LazySplitpanes from './components/LazySplitpanes.vue';
import AssetList from './views/AssetList.vue';
import AssetPreview from './views/AssetPreview.vue';
</script>
