<template>
  <div class="menu-bar">
    <MenuDropdown
      v-for="(item, i) in config"
      :ref="c => (dropdownRefs[i] = c as any)"
      :key="i"
      :index="i"
      :config="markRaw(item)"
    />
    <div class="right-area">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { closeMenuExceptKey, hasMenuOpenKey } from '@/types/menuProvide';
import type { MenuDropdownConfig } from './MenuDropdown.vue';
import MenuDropdown from './MenuDropdown.vue';

export type MenuBarConfig = MenuDropdownConfig[];

defineProps<{
  config: MenuBarConfig;
}>();

const dropdownRefs: Array<InstanceType<typeof MenuDropdown>> = [];

provide(hasMenuOpenKey, () => dropdownRefs.some(ref => ref.isOpen()));
provide(closeMenuExceptKey, index => {
  dropdownRefs.forEach((ref, i) => {
    if (i !== index && ref.isOpen()) ref.close();
  });
});
</script>

<style lang="scss" scoped>
.menu-bar {
  display: flex;
  position: relative;
  padding: 0 8px;
  background-color: var(--el-color-info-light-9);
}

.right-area {
  display: flex;
  height: 32px;
  margin-left: auto;
  align-items: center;
}
</style>
