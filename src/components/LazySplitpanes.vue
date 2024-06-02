<template>
  <Splitpanes class="default-theme" @resize="handleResize" @resized="handleResized">
    <Pane :size="paneSize">
      <div ref="leftPane" class="lazy-width-container" :style="isResizing ? leftPaneStyle : {}">
        <slot name="left"></slot>
      </div>
    </Pane>
    <Pane>
      <div ref="rightPane" class="lazy-width-container" :style="isResizing ? rightPaneStyle : {}">
        <slot name="right"></slot>
      </div>
    </Pane>
  </Splitpanes>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import { Pane, Splitpanes } from 'splitpanes';
import type { CSSProperties, Ref } from 'vue';
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{
    localStorageKey?: string;
    defaultLeftWidth?: number;
  }>(),
  {
    defaultLeftWidth: 50,
  },
);

const paneSize = props.localStorageKey
  ? useLocalStorage(props.localStorageKey, props.defaultLeftWidth)
  : ref(props.defaultLeftWidth);

const leftPane = ref<HTMLElement>();
const rightPane = ref<HTMLElement>();

const leftPaneStyle = ref<CSSProperties>({});
const rightPaneStyle = ref<CSSProperties>({});

const isResizing = ref(false);

const updateFixedStyle = (style: Ref<CSSProperties>, el: Ref<HTMLElement | undefined>) => {
  const { width } = el.value!.getBoundingClientRect();
  style.value = { width: `${width}px` };
};

const handleResize = () => {
  if (isResizing.value || !leftPane.value || !rightPane.value) return;
  updateFixedStyle(leftPaneStyle, leftPane);
  updateFixedStyle(rightPaneStyle, rightPane);
  isResizing.value = true;
};

const handleResized = ([{ size }]: Array<{ size: number }>) => {
  isResizing.value = false;
  paneSize.value = size;
};
</script>

<style lang="scss" scoped>
.lazy-width-container {
  height: 100%;
}
</style>
