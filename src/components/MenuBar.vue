<template>
  <div class="menu-bar">
    <MenuDropdown v-for="(item, i) in config" :key="i" :config="markRaw(item)" />
  </div>
</template>

<script setup lang="ts">
import type { MenuDropdownConfig } from './MenuDropdown.vue';
import MenuDropdown from './MenuDropdown.vue';

export type MenuBarConfig = MenuDropdownConfig[];

defineProps<{
  config: MenuBarConfig;
}>();
</script>
