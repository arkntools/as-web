<template>
  <el-container>
    <el-header>Header</el-header>
    <el-container :style="{ minHeight: 0 }">
      <Splitpanes class="default-theme" @resize="paneSize = $event[0].size">
        <Pane :size="paneSize">
          <AssetList />
        </Pane>
        <Pane>Main2</Pane>
      </Splitpanes>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import { Splitpanes, Pane } from 'splitpanes';
import AssetList from './views/AssetList.vue';

const paneSize = useLocalStorage('asset-list-width', 60);
</script>

<style lang="less" scoped>
.main {
  padding: 0;
}
</style>
