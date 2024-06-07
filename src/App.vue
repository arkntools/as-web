<template>
  <el-container>
    <el-header height="auto" :style="{ padding: 0 }">
      <AppHeader />
    </el-header>
    <el-container :style="{ minHeight: 0 }">
      <LazySplitpanes local-storage-key="asset-list-width" :default-left-width="60">
        <template #left>
          <AssetList ref="listRef" />
        </template>
        <template #right>
          <AssetPreview @goto-asset="pathId => listRef?.gotoAsset(pathId)" />
        </template>
      </LazySplitpanes>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import LazySplitpanes from './components/LazySplitpanes.vue';
import AppHeader from './views/AppHeader.vue';
import AssetList from './views/AssetList.vue';
import AssetPreview from './views/AssetPreview.vue';

const listRef = ref<InstanceType<typeof AssetList>>();
</script>
