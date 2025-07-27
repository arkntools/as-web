<template>
  <div class="asset-spine-viewer">
    <div ref="container" class="player-container"></div>
    <div class="color-picker">
      <el-color-picker
        v-model="bgColor"
        popper-class="player-bg-color-picker-popper"
        size="large"
        :show-alpha="true"
        color-format="hex"
        :predefine="['#00000000', '#ffffffff', '#000000ff', '#00ff00ff']"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import '@/lib/spine-player/index.css';
import { useElementSize, useLocalStorage } from '@vueuse/core';
import { groupBy } from 'es-toolkit';
import isJson from 'is-json';
import spine from '@/lib/spine-player';
import type { SpineItem, SpineItemType } from '@/workers/assetManager/utils/cache';

const { data } = defineProps<{
  asset: any;
  data: SpineItem<string>[] | null;
}>();

const container = useTemplateRef('container');
const containerSize = useElementSize(container);

const bgColor = useLocalStorage('asset-spine-viewer-bg-color', '#00000000');

const spineData = computed(() => (data ? groupBy(data, item => item.type) : null));

const animationHeight = ref(0);

const spineViewPort = computed(() => {
  const { width, height } = containerSize;
  return {
    x: -width.value,
    y: -height.value + animationHeight.value / 2,
    width: width.value * 2,
    height: height.value * 2,
  };
});

let player: spine.SpinePlayer | undefined;

watch(spineViewPort, async () => {
  if (!player) return;
  Object.assign(player.currentViewport || player.config.viewport, spineViewPort.value);
});

watch(bgColor, val => {
  if (!player) return;
  player.config.backgroundColor = val;
});

const cleanUp = () => {
  if (player) {
    player.stopRendering();
    player.context.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
  if (container.value) container.value.innerHTML = '';
};

const loadSpine = async (data: Record<SpineItemType, SpineItem<string>[]> | null) => {
  if (!data || !container.value) return;

  const { skel = [], atlas = [], image = [] } = data;
  if (!skel.length || !atlas.length || !image.length) return;
  const { name: imgName, data: imgUrl } = image[0];

  const skelUrl = skel[0].data;
  const isJsonSkel = isJson(await fetch(skelUrl).then(res => res.text()));

  cleanUp();

  player = new spine.SpinePlayer(container.value, {
    skelUrl: isJsonSkel ? undefined : skelUrl,
    jsonUrl: isJsonSkel ? skelUrl : undefined,
    atlasUrl: atlas[0].data,
    rawDataURIs: {
      [imgName]: imgUrl,
    },
    viewport: {
      ...spineViewPort.value,
      padLeft: 0,
      padRight: 0,
      padTop: 0,
      padBottom: 0,
      transitionTime: 0,
    },
    alpha: true,
    backgroundColor: bgColor.value,
    onCalculateAnimationViewport: ({ height }) => {
      animationHeight.value = height;
    },
  });

  (window as any).player = player;
};

onMounted(() => {
  watch(spineData, loadSpine, { immediate: true });
});

onBeforeUnmount(() => {
  cleanUp();
});
</script>

<style lang="scss" scoped>
.asset-spine-viewer {
  width: 100%;
  height: 100%;
}

.player-container {
  width: 100%;
  height: 100%;
  $size: 10px;
  $color: #e3e3e3;
  background-color: #fff;
  background-image:
    linear-gradient(45deg, $color 25%, transparent 25%), linear-gradient(-45deg, $color 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, $color 75%), linear-gradient(-45deg, transparent 75%, $color 75%);
  background-size: #{$size * 2} #{$size * 2};
  background-position:
    0 0,
    0 #{$size},
    #{$size} #{-$size},
    #{-$size} 0;
}

.color-picker {
  position: absolute;
  top: 16px;
  right: 16px;
}
</style>

<style lang="scss">
.player-bg-color-picker-popper {
  .el-color-predefine__color-selector {
    margin-top: 6px;
    &.is-alpha > div {
      background-color: transparent !important;
    }
    &:not(.selected) {
      box-shadow: 0 0 3px 2px rgba(0, 0, 0, 0.12);
    }
  }
  .el-color-dropdown__btns {
    margin-top: 4px;
  }
}
</style>
