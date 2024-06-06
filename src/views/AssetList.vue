<template>
  <div class="asset-list-table-wrapper">
    <div class="asset-list-table-main">
      <vxe-table
        id="asset-list-table"
        ref="tableRef"
        class="asset-list-table"
        :data="store.assetInfos"
        :border="true"
        size="mini"
        height="100%"
        header-cell-class-name="cursor-pointer"
        :row-class-name="
          ({ row }) => ({
            highlight: row.key === highlightRowKey,
            // fix highlight current row bug
            'row--current': row.key === store.curAssetInfo?.key,
          })
        "
        :row-config="{
          useKey: true,
          keyField: 'key',
          isCurrent: true,
          isHover: true,
        }"
        :column-config="{ resizable: true }"
        :menu-config="menuConfig"
        :keyboard-config="{ isArrow: true }"
        :checkbox-config="
          isMultiSelect ? { trigger: 'row', highlight: true, range: true, isShiftKey: true } : undefined
        "
        :custom-config="{ storage: { visible: true, resizable: true } }"
        :scroll-y="{ enabled: true }"
        show-overflow="title"
        show-header-overflow
        @menu-click="handleMenu"
        @cell-menu="handleCellMenu"
        @cell-click="updateMultiSelectNum"
        @current-change="handleCurrentChange"
        @header-cell-click="handleHeaderCellClick"
        @checkbox-range-end="updateMultiSelectNum"
        @checkbox-all="updateMultiSelectNum"
      >
        <vxe-column
          v-if="isMultiSelect"
          type="checkbox"
          :width="38"
          :resizable="false"
          fixed="left"
          header-class-name="cell-overflow-visible"
          class-name="cell-overflow-visible"
        ></vxe-column>
        <vxe-column field="name" title="Name" fixed="left" :min-width="120" sortable></vxe-column>
        <vxe-column field="container" title="Container" :min-width="60" sortable></vxe-column>
        <vxe-column field="type" title="Type" :width="90" sortable :filters="typeFilterOptions"></vxe-column>
        <vxe-column field="pathId" title="PathID" :min-width="60"></vxe-column>
        <vxe-column field="size" title="Size" align="right" header-align="left" :width="80" sortable></vxe-column>
      </vxe-table>
    </div>
    <div v-if="isMultiSelect" class="asset-list-table-footer">
      <div>{{ multiSelectNum }} asset{{ multiSelectNum > 1 ? 's' : '' }} selected.</div>
      <div class="actions">
        <el-button type="primary" size="small" @click="handleCancelMultiSelect">Cancel</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VxeTableEvents, VxeTableInstance, VxeTablePropTypes } from 'vxe-table';
import ab from '@/assets/arkn.ab?url';
import { useAssetManager } from '@/store/assetManager';
import { sleep } from '@/utils/common';
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

const isMultiSelect = ref(false);
const multiSelectNum = ref(0);

const updateMultiSelectNum = () => {
  multiSelectNum.value = tableRef.value!.getCheckboxRecords().length;
};

const handleCancelMultiSelect = () => {
  tableRef.value?.clearCheckboxRow();
  isMultiSelect.value = false;
};

const setCurrentRow = (row: AssetInfo) => {
  if (!tableRef.value) return;
  tableRef.value.setCurrentRow(row);
  store.setCurAssetInfo(row);
};

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
      [{ code: 'multiselect', name: 'Multi select', prefixIcon: 'vxe-icon-square-checked' }],
    ],
  },
  visibleMethod: ({ type, options, columns, column }) => {
    if (type !== 'header') {
      return !isMultiSelect.value;
    }
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

const handleMenu: VxeTableEvents.MenuClick<AssetInfo> = async ({ $table, menu, row, column }) => {
  switch (menu.code) {
    case 'copy':
      await navigator.clipboard.writeText(String((row as any)[column.field]));
      break;
    case 'export':
      await store.exportAsset(row);
      break;
    case 'multiselect':
      isMultiSelect.value = true;
      multiSelectNum.value = 1;
      $table.setCheckboxRow(row, true);
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

const handleCellMenu: VxeTableEvents.CellMenu<AssetInfo> = ({ row, $event }) => {
  if (isMultiSelect.value) {
    $event.preventDefault();
    return;
  }
  setCurrentRow(row);
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
  if (!info) {
    ElMessage({
      message: `Unable to find asset with pathId ${pathId}`,
      type: 'error',
      grouping: true,
    });
    return;
  }

  if ($table.isActiveFilterByColumn(null)) await $table.clearFilter();
  $table.scrollToRow(info);

  if (highlightTimer) clearTimeout(highlightTimer);
  if (highlightRowKey.value === info.key) {
    highlightRowKey.value = '';
    await sleep();
  }
  highlightRowKey.value = info.key;
  highlightTimer = setTimeout(() => {
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
        background-color: var(--el-color-warning-light-3);
      }
    }
  }

  &-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  &-main {
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 0;
    overflow: visible;
  }

  &-footer {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    height: 40px;
    padding: 0 16px;
    background-color: var(--el-color-info-light-9);

    .actions {
      margin-left: auto;
    }
  }
}
</style>
