<template>
  <Splitpanes class="default-theme" @resize="handleResize" @resized="handleResized">
    <Pane class="pane" :size="paneSize">
      <div ref="leftPane" class="lazy-width-container" :style="isResizing ? leftPaneStyle : {}">
        <slot name="left"></slot>
      </div>
      <div v-if="isResizing" class="resize-mask"></div>
    </Pane>
    <Pane class="pane">
      <div ref="rightPane" class="lazy-width-container" :style="isResizing ? rightPaneStyle : {}">
        <slot name="right"></slot>
      </div>
      <div v-if="isResizing" class="resize-mask"></div>
    </Pane>
  </Splitpanes>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import { Pane, Splitpanes } from 'splitpanes';
import type { CSSProperties } from 'vue';

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

const updateFixedStyle = (style: Ref<CSSProperties>, el: Ref<HTMLElement | undefined>, onRight = false) => {
  const { width } = el.value!.getBoundingClientRect();
  style.value = {
    position: 'absolute',
    width: `${width}px`,
    right: onRight ? 0 : undefined,
  };
};

const handleResize = () => {
  if (isResizing.value || !leftPane.value || !rightPane.value) return;
  updateFixedStyle(leftPaneStyle, leftPane);
  updateFixedStyle(rightPaneStyle, rightPane, true);
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

.pane {
  position: relative;
  transition: none;
}

.resize-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 10;
}
</style>
