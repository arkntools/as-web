<template>
  <el-dialog v-model="show" title="Export options" width="min(500px, calc(100vw - 16px))">
    <el-form label-width="auto" label-position="top">
      <el-form-item label="Group exported assets by">
        <el-select v-model="setting.data.exportGroupMethod" :style="{ width: '200px' }">
          <el-option v-for="{ label, value } in exportGroupMethodOptions" :key="value" :label="label" :value="value" />
        </el-select>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { useSetting } from '@/store/setting';
import { ExportGroupMethod } from '@/types/export';

const setting = useSetting();

const show = ref(false);

const exportGroupMethodOptions: Array<{ label: string; value: ExportGroupMethod }> = [
  {
    label: 'do not group',
    value: ExportGroupMethod.NONE,
  },
  {
    label: 'type name',
    value: ExportGroupMethod.TYPE_NAME,
  },
  {
    label: 'source file name',
    value: ExportGroupMethod.SOURCE_FILE_NAME,
  },
  {
    label: 'container path',
    value: ExportGroupMethod.CONTAINER_PATH,
  },
];

defineExpose({
  open: () => {
    show.value = true;
  },
});
</script>
