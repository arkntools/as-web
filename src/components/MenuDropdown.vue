<template>
  <el-dropdown
    ref="dropdownRef"
    popper-class="menu-dropdown"
    trigger="click"
    placement="bottom-start"
    :popper-options="popoverOptions"
    :hide-on-click="false"
    @command="handleCommand"
    @visible-change="handleVisibleChange"
  >
    <el-button class="menu-btn" :class="{ active: isOpen }" plain color="#444" @mouseenter="handleMouseEnter">{{
      config.name
    }}</el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="(item, i) in toValue(config.items)"
          :key="i"
          :command="i"
          :disabled="toValue(item.disabled)"
          :divided="item.divided"
          :icon="item.icon?.() || defaultIcon"
          :title="item.title"
          :style="{ '--color': toValue(item.iconColor) }"
          >{{ toValue(item.name) }}</el-dropdown-item
        >
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import type { ElDropdown, ElDropdownItem } from 'element-plus';
import type { MaybeRefOrGetter } from 'vue';
import { closeMenuExceptKey, hasMenuOpenKey } from '@/types/menuProvide';

export interface MenuDropdownConfig {
  name: string;
  icon?: boolean;
  items: MaybeRefOrGetter<MenuDropdownConfigItem[]>;
  onClose?: () => void;
}

export interface MenuDropdownConfigItem {
  name: MaybeRefOrGetter<string>;
  handler: () => any;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  divided?: boolean;
  keepShowOnClick?: MaybeRefOrGetter<boolean | undefined>;
  title?: string;
  icon?: () => InstanceType<typeof ElDropdownItem>['icon'];
  iconColor?: MaybeRefOrGetter<string | undefined>;
}

const props = defineProps<{
  index: number;
  config: MenuDropdownConfig;
}>();

const dropdownRef = useTemplateRef('dropdownRef');

const hasMenuOpen = inject(hasMenuOpenKey);
const closeMenuExcept = inject(closeMenuExceptKey);

const isOpen = ref(false);

const defaultIcon = computed(() => (props.config.icon ? () => undefined : undefined));

const handleCommand = (i: number) => {
  const item = toValue(props.config.items)[i];
  item.handler();
  if (!toValue(item.keepShowOnClick)) dropdownRef.value?.handleClose();
};

const handleVisibleChange = (visible: boolean) => {
  isOpen.value = visible;
  if (!visible) props.config.onClose?.();
};

const handleMouseEnter = () => {
  if (hasMenuOpen?.()) {
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
