<template>
  <vxe-table
    ref="tableRef"
    class="asset-dump-table"
    cell-class-name="asset-dump-table__cell"
    border="none"
    size="mini"
    height="100%"
    :data="dumpRows"
    :show-header="false"
    :column-config="{ resizable: true }"
    :row-config="{ useKey: true, keyField: 'id', isHover: true }"
    :tree-config="{ transform: true, rowField: 'id', parentField: 'parentId' }"
    :scroll-y="{ enabled: true }"
    @cell-click="handleCellClick"
  >
    <vxe-column field="name" tree-node>
      <template #default="{ row }">
        <span class="key">{{ row.name }}</span
        ><span class="colon">: </span><span class="value" :class="row.type">{{ row.valueText }}</span>
        <el-icon v-if="row.isPPtr"><i-ep-search /></el-icon>
      </template>
    </vxe-column>
  </vxe-table>
</template>

<script setup lang="ts">
import { uid } from 'uid';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { VxeTableEvents, VxeTableInstance } from 'vxe-table';
import type { AssetInfo } from '@/workers/assetManager';

interface DumpRow {
  id: string;
  parentId?: string;
  name: string;
  value: any;
  type: string;
  valueText: string;
  isPPtr?: boolean;
}

const props = defineProps<{
  asset: AssetInfo;
}>();

const tableRef = ref<VxeTableInstance<DumpRow>>();

const getDumpValueText = (className: string | undefined, type: string, value: any) => {
  if (className) return className;
  switch (type) {
    case 'array':
      return `Array(${value.length})`;
    case 'object':
      return 'Object';
  }
  return String(value);
};

const dumpToRows = (rows: DumpRow[], obj: any, name: string, parentId?: string) => {
  if (obj === undefined) return rows;

  const id = uid();
  const type = Array.isArray(obj) ? 'array' : typeof obj;
  const className: string | undefined = obj?.__class;

  rows.push({
    id,
    parentId,
    name,
    value: obj,
    type,
    valueText: getDumpValueText(className, type, obj),
    isPPtr: className?.startsWith('PPtr'),
  });

  switch (type) {
    case 'array':
      (obj as any[]).forEach((item, i) => {
        dumpToRows(rows, item, String(i), id);
      });
      break;
    case 'object':
      Object.entries(obj).forEach(([key, value]) => {
        dumpToRows(rows, value, key, id);
      });
      break;
  }
};

const dumpRows = computed(() => {
  const rows: DumpRow[] = [];
  dumpToRows(rows, props.asset.dump, props.asset.name);
  return rows;
});

onMounted(() => {
  watch(
    dumpRows,
    async rows => {
      if (rows.length) {
        await nextTick();
        tableRef.value!.setTreeExpand(rows[0], true);
      }
    },
    { immediate: true },
  );
});

const handleCellClick: VxeTableEvents.CellClick<DumpRow> = ({ row }) => {
  tableRef.value!.toggleTreeExpand(row);
};
</script>

<style lang="scss" scoped>
.asset-dump-table {
  user-select: text;

  :deep(.asset-dump-table__cell) {
    padding: 0 !important;
    font-family: Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  }
}

.key {
  color: #881391;
}
.boolean {
  color: #1c00cf;
}
.null,
.undefined {
  color: #808080;
}
.bigint,
.number {
  color: rgb(28, 0, 207);
}
.string {
  color: rgb(196, 26, 22);
}
.colon,
.object,
.array {
  color: #000;
}
</style>
