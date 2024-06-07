<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <el-button class="menu-btn" plain type="info">{{ config.name }}</el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="(item, i) in config.items"
          :key="i"
          :command="i"
          :disabled="item.disabled?.()"
          :divided="item.divided"
          :icon="item.icon"
          >{{ item.name }}</el-dropdown-item
        >
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
export interface MenuDropdownConfig {
  name: string;
  items: Array<{
    name: string;
    handler: () => any;
    disabled?: () => boolean;
    divided?: boolean;
    icon?: any;
  }>;
}

const props = defineProps<{
  config: MenuDropdownConfig;
}>();

const handleCommand = (i: number) => {
  props.config.items[i].handler();
};
</script>

<style lang="scss" scoped>
.menu-btn {
  border: none;
  border-radius: 0;
  outline: none;
}
</style>
