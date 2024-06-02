<template>
  <vxe-table
    ref="tableRef"
    :data="store.assetInfos"
    :border="true"
    size="mini"
    height="100%"
    :row-config="{
      useKey: true,
      keyField: 'key',
      isCurrent: true,
      isHover: true,
    }"
    :column-config="{ resizable: true }"
    :menu-config="menuConfig"
    :scroll-y="{ enabled: true }"
    show-overflow="title"
    show-header-overflow
    @menu-click="handleMenu"
    @cell-menu="handleCellMenu"
    @current-change="handleCurrentChange"
  >
    <vxe-column field="name" title="Name" fixed="left" :min-width="120"></vxe-column>
    <vxe-column field="container" title="Container" :min-width="60"></vxe-column>
    <vxe-column field="type" title="Type" :width="90"></vxe-column>
    <vxe-column field="pathId" title="PathID" :min-width="60"></vxe-column>
    <vxe-column field="size" title="Size" align="right" header-align="left" :width="80"></vxe-column>
  </vxe-table>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { VxeTableEvents, VxeTableInstance, VxeTablePropTypes } from 'vxe-table';
import ab from '@/assets/arkn.ab?url';
import { useAssetManager } from '@/store/assetManager';
import type { AssetInfo } from '@/workers/assetManager';

const getAbFile = async () => {
  const buffer = await fetch(ab).then(r => r.arrayBuffer());
  return new File([buffer], 'test.ab');
};

const tableRef = ref<VxeTableInstance<AssetInfo>>();

const store = useAssetManager();

onMounted(async () => {
  await store.loadFiles([await getAbFile()]);
});

const menuConfig: VxeTablePropTypes.MenuConfig<AssetInfo> = {
  body: {
    options: [
      [
        { code: 'copy', name: 'Copy text' },
        { code: 'export', name: 'Export select asset' },
      ],
    ],
  },
};

const handleMenu: VxeTableEvents.MenuClick<AssetInfo> = async ({ menu, row, column }) => {
  switch (menu.code) {
    case 'copy':
      await navigator.clipboard.writeText(String((row as any)[column.field]));
      break;
  }
};

const handleCellMenu: VxeTableEvents.CellMenu<AssetInfo> = ({ row }) => {
  tableRef.value?.setCurrentRow(row);
};

const handleCurrentChange: VxeTableEvents.CurrentChange<AssetInfo> = ({ row }) => {
  store.setCurAssetInfo(row);
};
</script>

<style></style>
