<template>
  <div class="resource-list">
    <div class="resource-list-header">
      <el-input v-model="searchInput" class="search-input" placeholder="Search" :prefix-icon="IElSearch" clearable />
      <el-select
        v-model="repoManager.repoId"
        :class="{ 'repo-select-loading': !repoListOptions.length }"
        :options="repoListOptions"
        :loading="!repoListOptions.length"
        :show-arrow="false"
        :offset="0"
        :fallback-placements="[]"
        placeholder="Select repository"
        style="margin-top: -1px"
      />
    </div>
    <div class="resource-list-main">
      <vxe-table
        id="resource-list-table"
        ref="tableRef"
        class="resource-list-table"
        :data="searchedResList"
        :loading="repoManager.isLoading"
        :border="true"
        size="mini"
        height="100%"
        header-cell-class-name="cursor-pointer"
        :row-config="{
          useKey: true,
          keyField: 'id',
          isCurrent: true,
          isHover: true,
        }"
        :column-config="{ resizable: true }"
        :keyboard-config="{ isArrow: true }"
        :custom-config="{ storage: { visible: true, resizable: true } }"
        :menu-config="menuConfig"
        :scroll-y="{ enabled: true }"
        show-overflow="title"
        show-header-overflow
        @header-cell-click="handleHeaderCellClick"
        @menu-click="handleMenu"
        @cell-menu="handleCellMenu"
        @cell-dblclick="handleCellDblclick"
      >
        <vxe-column field="name" title="Name" fixed="left" sortable :sort-by="sortNameMethod">
          <template #default="{ row }">
            <div class="resource-list-table__cell-name">
              <div class="res-name">{{ row.name }}</div>
              <ResourceFetchProgress :value="repoManager.resProgressMap.get(row.id)" />
            </div>
          </template>
        </vxe-column>
        <vxe-column field="size" title="Size" :width="80" sortable />
        <vxe-column field="abSize" title="AB Size" :width="80" :visible="false" sortable />
        <template #empty>
          <el-empty description="No data" />
        </template>
      </vxe-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ResourceItem } from '@arkntools/as-web-repo';
import IElSearch from '~icons/ep/search';
import { saveAs } from 'file-saver';
import type { VxeColumnPropTypes, VxeTableEvents, VxeTableInstance, VxeTablePropTypes } from 'vxe-table';
import ResourceFetchProgress from '@/components/ResourceFetchProgress.vue';
import { useNatsort } from '@/hooks/useNatsort';
import { useRefDebouncedConditional } from '@/hooks/useRef';
import { useAssetManager } from '@/store/assetManager';
import { useRepository } from '@/store/repository';
import { getLegalFileName } from '@/utils/file';
import { getMenuHeaderConfig, getVxeTableCommonTools, handleCommonMenu } from '@/utils/vxeTableCommon';

const tableRef = useTemplateRef<VxeTableInstance>('tableRef');
const { handleHeaderCellClick, menuConfigVisibleMethodProcessHeader } = getVxeTableCommonTools(tableRef);

const assetManager = useAssetManager();
const repoManager = useRepository();

const { source: searchInput, result: searchInputDebounced } = useRefDebouncedConditional({
  initValue: '',
  delay: 200,
  condition: v => !!v,
});

const searchedResList = computed(() => {
  const searchText = searchInputDebounced.value.toLowerCase();
  if (!searchText) return repoManager.resList;
  return repoManager.resList.filter(({ name }) => name.toLowerCase().includes(searchText));
});

const getResNameSortIndex = useNatsort(() => repoManager.resList.map(({ name }) => name));
const sortNameMethod: VxeColumnPropTypes.SortBy<ResourceItem> = ({ row }) => getResNameSortIndex(row.name);

const menuConfig: VxeTablePropTypes.MenuConfig<ResourceItem> = reactive({
  header: getMenuHeaderConfig(),
  body: {
    options: [
      [
        { code: 'copy', name: 'Copy text', prefixIcon: 'vxe-icon-copy' },
        { code: 'loadRes', name: 'Load resource', prefixIcon: 'vxe-icon-file-zip' },
        { code: 'download', name: 'Download', prefixIcon: 'vxe-icon-download' },
      ],
    ],
  },
  visibleMethod: params => {
    if (params.type === 'header') {
      menuConfigVisibleMethodProcessHeader(params);
    }
    return true;
  },
});

const handleMenu: VxeTableEvents.MenuClick<ResourceItem> = async params => {
  const { menu, row } = params;
  switch (menu.code) {
    case 'download':
      downloadRes(row);
      break;
    case 'loadRes':
      loadRes(row);
      break;
    default:
      handleCommonMenu(params);
      break;
  }
};

const handleCellMenu: VxeTableEvents.CellMenu<ResourceItem> = ({ row }) => {
  if (!tableRef.value) return;
  tableRef.value.setCurrentRow(row);
};

const handleCellDblclick: VxeTableEvents.CellDblclick<ResourceItem> = ({ row }) => {
  loadRes(row);
};

const downloadRes = async (row: ResourceItem) => {
  const res = await repoManager.getResource(row);
  if (!res) return;
  saveAs(res, getLegalFileName(row.name));
};

let curLoadingResId: any;

const loadRes = async (row: ResourceItem) => {
  curLoadingResId = row.id;
  const res = await repoManager.getResource(row);
  if (!res || curLoadingResId !== row.id) return;
  try {
    await assetManager.loadFiles([new File([res], row.name)]);
  } finally {
    curLoadingResId = undefined;
  }
};

const repoListOptions = computed(() =>
  repoManager.repoList.map(repo => ({
    label: repo.name,
    value: repo.id,
  })),
);
</script>

<style lang="scss" scoped>
.resource-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  &-main {
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 0;
    overflow: visible;
    z-index: 0;
  }

  &-header {
    --el-border-radius-base: 0;
    flex-shrink: 0;
    margin-bottom: -1px;
    z-index: 10;

    :deep(.el-input__wrapper) {
      &:hover {
        z-index: 10;
      }
      &.is-focus {
        z-index: 100;
      }
    }

    :deep(.el-select__wrapper) {
      &:hover {
        z-index: 10;
      }
      &.is-focused {
        z-index: 100;
      }
    }
  }
}

.resource-list-table__cell-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.res-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repo-select-loading {
  :deep(.el-select__placeholder) {
    opacity: 0;
  }
}
</style>
