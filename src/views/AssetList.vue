<template>
  <el-table
    :data="tableData"
    :border="true"
    :highlight-current-row="true"
    size="small"
    height="100%"
    style="width: 100%"
  >
    <el-table-column prop="name" label="Name" />
    <el-table-column prop="type" label="Type" />
    <el-table-column prop="pathId" label="PathId" />
  </el-table>
</template>

<script setup lang="ts">
const tableData = new Array(30).fill(undefined).map(() => ({
  name: 'asd',
  type: 'TextAsset',
  pathId: '1231123',
}));
</script>

<style></style>
