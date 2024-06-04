<template>
  <vxe-table
    ref="tableRef"
    id="asset-list-table"
    class="asset-list-table"
    :data="store.assetInfos"
    :border="true"
    size="mini"
    height="100%"
    header-cell-class-name="cursor-pointer"
    :row-class-name="({ row }) => (row.key === highlightRowKey ? 'highlight' : null)"
    :row-config="{
      useKey: true,
      keyField: 'key',
      isCurrent: true,
      isHover: true,
    }"
    :column-config="{ resizable: true }"
    :menu-config="menuConfig"
    :keyboard-config="{ isArrow: true }"
    :custom-config="{ storage: { visible: true, resizable: true } }"
    :scroll-y="{ enabled: true }"
    show-overflow="title"
    show-header-overflow
    @menu-click="handleMenu"
    @cell-menu="handleCellMenu"
    @current-change="handleCurrentChange"
    @header-cell-click="handleHeaderCellClick"
  >
    <vxe-column field="name" title="Name" fixed="left" :min-width="120" sortable></vxe-column>
    <vxe-column field="container" title="Container" :min-width="60" sortable></vxe-column>
    <vxe-column field="type" title="Type" :width="90" sortable :filters="typeFilterOptions"></vxe-column>
    <vxe-column field="pathId" title="PathID" :min-width="60"></vxe-column>
    <vxe-column field="size" title="Size" align="right" header-align="left" :width="80" sortable></vxe-column>
  </vxe-table>
</template>

<script setup lang="ts">
import type { VxeTableEvents, VxeTableInstance, VxeTablePropTypes } from 'vxe-table';
import ab from '@/assets/arkn.ab?url';
import { useAssetManager } from '@/store/assetManager';
import type { AssetInfo } from '@/workers/assetManager';
import { sleep } from '@/utils/common';

const getAbFile = async () => {
  const buffer = await fetch(ab).then(r => r.arrayBuffer());
  return new File([buffer], 'test.ab');
};

const tableRef = ref<VxeTableInstance<AssetInfo>>();

const store = useAssetManager();

onMounted(async () => {
  await store.loadFiles([await getAbFile()]);
});

const switchColumnSort = (field: string) => {
  const $table = tableRef.value;
  if (!$table) return;
  const [cur] = $table.getSortColumns();
  if (!cur || cur.field !== field) {
    $table.sort(field, 'asc');
  } else if (cur.order === 'asc') {
    $table.sort(field, 'desc');
  } else {
    $table.clearSort(field);
  }
};

const typeFilterOptions = computed(() =>
  [...new Set(store.assetInfos.map(({ type }) => type)).values()].sort().map(value => ({ label: value, value })),
);

const menuConfig: VxeTablePropTypes.MenuConfig<AssetInfo> = reactive({
  header: {
    options: [
      [{ code: 'hideColumn', name: 'Hide this column', prefixIcon: 'vxe-icon-eye-fill-close', disabled: false }],
      [
        { code: 'sortAsc', name: 'Sort asc', prefixIcon: '', visible: true, disabled: false },
        { code: 'sortDesc', name: 'Sort ↓ desc', prefixIcon: '', visible: true, disabled: false },
        { code: 'clearSort', name: 'Clear sort', visible: true, disabled: false },
      ],
      [
        { code: 'resetResizable', name: 'Reset all widths', prefixIcon: 'vxe-icon-ellipsis-h' },
        { code: 'resetVisible', name: 'Reset all visibility', prefixIcon: 'vxe-icon-eye-fill', disabled: false },
      ],
    ],
  },
  body: {
    options: [
      [
        { code: 'copy', name: 'Copy text', prefixIcon: 'vxe-icon-copy' },
        { code: 'export', name: 'Export select asset', prefixIcon: 'vxe-icon-save' },
      ],
    ],
  },
  visibleMethod: ({ type, options, columns, column }) => {
    if (type !== 'header') return true;
    const sortOption = options[1];
    if (column?.sortable) {
      const [cur] = tableRef.value!.getSortColumns();
      if (!cur || cur.field !== column.field) {
        sortOption[0].disabled = false;
        sortOption[1].disabled = false;
        sortOption[2].disabled = !cur;
      } else if (cur.order === 'asc') {
        sortOption[0].disabled = true;
        sortOption[1].disabled = false;
        sortOption[2].disabled = false;
      } else {
        sortOption[0].disabled = false;
        sortOption[1].disabled = true;
        sortOption[2].disabled = false;
      }
      sortOption.forEach(item => {
        item.visible = true;
      });
      const isNumber = typeof (store.assetInfos[0] as any)?.[column.field] === 'number';
      sortOption[0].prefixIcon = isNumber ? 'vxe-icon-sort-numeric-asc' : 'vxe-icon-sort-alpha-asc';
      sortOption[1].prefixIcon = isNumber ? 'vxe-icon-sort-numeric-desc' : 'vxe-icon-sort-alpha-desc';
    } else {
      sortOption.forEach(item => {
        item.visible = false;
      });
    }
    options[0][0].disabled = columns.length <= 1;
    options[2][1].disabled = columns.length >= 5;
    return true;
  },
});

const handleMenu: VxeTableEvents.MenuClick<AssetInfo> = async ({ menu, row, column }) => {
  const $table = tableRef.value!;
  switch (menu.code) {
    case 'copy':
      await navigator.clipboard.writeText(String((row as any)[column.field]));
      break;
    case 'hideColumn':
      await $table.hideColumn(column);
      break;
    case 'sortAsc':
      await $table.sort(column.field, 'asc');
      break;
    case 'sortDesc':
      await $table.sort(column.field, 'desc');
      break;
    case 'clearSort':
      await $table.clearSort(column.field);
      break;
    case 'resetResizable':
      await $table.resetColumn({ resizable: true, visible: false });
      break;
    case 'resetVisible':
      await $table.resetColumn({ resizable: false, visible: true });
      break;
  }
};

const handleCellMenu: VxeTableEvents.CellMenu<AssetInfo> = ({ row }) => {
  tableRef.value?.setCurrentRow(row);
};

const handleCurrentChange: VxeTableEvents.CurrentChange<AssetInfo> = ({ row }) => {
  store.setCurAssetInfo(row);
};

const handleHeaderCellClick: VxeTableEvents.HeaderCellClick<AssetInfo> = ({ column, $event: { target } }) => {
  if ((target as HTMLElement)?.tagName === 'I') return;
  switchColumnSort(column.field);
};

const highlightRowKey = ref('');
let highlightTimer: NodeJS.Timeout | null = null;

const gotoAsset = async (pathId: bigint) => {
  const $table = tableRef.value;
  if (!$table) return;

  const info = store.assetInfos.find(i => i.pathId === pathId);
  if (!info) return;

  if ($table.isActiveFilterByColumn(null)) await $table.clearFilter();
  $table.scrollToRow(info);

  if (highlightTimer) clearTimeout(highlightTimer);
  if (highlightRowKey.value === info.key) {
    highlightRowKey.value = '';
    await sleep();
  }
  highlightRowKey.value = info.key;
  highlightTimer = setTimeout(() => {
    highlightRowKey.value = '';
    highlightTimer = null;
  }, 1.5e3);
};

defineExpose({ gotoAsset });
</script>

<style lang="scss" scoped>
.asset-list-table {
  :deep(.highlight) {
    animation: highlight 1.5s;

    @keyframes highlight {
      0%,
      33%,
      66%,
      100% {
        background-color: transparent;
      }
      16%,
      49%,
      82% {
        background-color: #ffd700;
      }
    }
  }
}
</style>
