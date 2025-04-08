<template>
  <el-dropdown
    ref="dropdownRef"
    popper-class="menu-dropdown"
    trigger="click"
    placement="bottom-start"
    :popper-options="popoverOptions"
    @command="handleCommand"
    @visible-change="visible => (isOpen = visible)"
  >
    <el-button class="menu-btn" :class="{ active: isOpen }" plain color="#444" @mouseenter="handleMouseEnter">{{
      config.name
    }}</el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="(item, i) in config.items"
          :key="i"
          :command="i"
          :disabled="item.disabled?.()"
          :divided="item.divided"
          :icon="item.icon?.() || defaultIcon"
          >{{ item.name }}</el-dropdown-item
        >
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import type { ElDropdown, ElDropdownItem } from 'element-plus';
import { closeMenuExceptKey, hasMenuOpenKey } from '@/types/menuProvide';

export interface MenuDropdownConfig {
  name: string;
  icon?: boolean;
  items: MenuDropdownConfigItem[];
}

export interface MenuDropdownConfigItem {
  name: string;
  handler: () => any;
  disabled?: () => boolean;
  divided?: boolean;
  icon?: () => InstanceType<typeof ElDropdownItem>['icon'];
}

const props = defineProps<{
  index: number;
  config: MenuDropdownConfig;
}>();

const dropdownRef = ref<InstanceType<typeof ElDropdown>>();

const hanMenuOpen = inject(hasMenuOpenKey);
const closeMenuExcept = inject(closeMenuExceptKey);

const isOpen = ref(false);

const defaultIcon = computed(() => (props.config.icon ? () => undefined : undefined));

const handleCommand = (i: number) => {
  props.config.items[i].handler();
};

const handleMouseEnter = () => {
  if (hanMenuOpen?.()) {
    closeMenuExcept?.(props.index);
    dropdownRef.value?.handleOpen();
  }
};

const popoverOptions = {
  modifiers: [
    {
      name: 'offset',
      options: { offset: [-1, 0] },
    },
    {
      name: 'preventOverflow',
      options: { padding: 0 },
    },
    {
      name: 'computeStyles',
      options: { gpuAcceleration: false },
    },
  ],
};

defineExpose({
  isOpen: () => isOpen.value,
  close: () => {
    dropdownRef.value?.handleClose();
  },
});
</script>

<style lang="scss" scoped>
.menu-btn {
  --el-button-bg-color: var(--el-color-info-light-9) !important;
  border: none;
  border-radius: 0;
  outline: none;

  &.active {
    color: var(--el-button-active-text-color);
    background-color: var(--el-button-active-bg-color);
  }
}
</style>

<style lang="scss">
.menu-dropdown {
  border-radius: 0;

  .el-popper__arrow {
    display: none;
  }
  .el-icon {
    transform: translateX(-4px);
  }
}
</style>
