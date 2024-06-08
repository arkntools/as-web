<template>
  <el-dialog v-model="show" title="UnityCN options" width="min(500px, calc(100vw - 16px))">
    <el-form label-width="auto" label-position="top">
      <el-form-item label="UnityCN key">
        <el-switch v-model="setting.data.unityCNKeyEnabled" active-text="Enabled" />
        <el-select
          v-model="setting.data.unityCNKey"
          class="unity-cn-select"
          popper-class="unity-cn-select-popper"
          size="large"
          clearable
          filterable
          allow-create
          default-first-option
          placeholder="Search or input custom key"
          :disabled="!setting.data.unityCNKeyEnabled"
          :reserve-keyword="false"
          :style="{ marginTop: '8px' }"
        >
          <template #label="{ label, value }">
            <div class="unity-cn-select-label">
              <span>{{ label === value ? 'Custom' : label }}</span>
              <el-text class="key" type="info" size="small">{{ value }}</el-text>
            </div>
          </template>
          <el-option v-for="{ key, name } in unityCNKeys" :key="key" :label="name" :value="key">
            <span>{{ name }}</span>
            <el-text class="key" type="info" size="small">{{ key }}</el-text>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import unityCNKeys from '@/assets/keys.json';
import { useSetting } from '@/store/setting';

const setting = useSetting();

const show = ref(false);

defineExpose({
  open: () => {
    show.value = true;
  },
});
</script>

<style lang="scss" scoped>
.key {
  align-self: unset;
  font-family: Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
.unity-cn-select {
  :deep(.el-select__selection) {
    height: 32px;
  }
  &-label {
    display: flex;
    flex-direction: column;
    justify-content: center;
    line-height: normal;
    height: 32px;
  }
}
</style>

<style lang="scss">
.unity-cn-select-popper {
  .el-select-dropdown__item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 48px;
    line-height: normal;
  }
}
</style>
