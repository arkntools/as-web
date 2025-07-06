<template>
  <div class="asset-image-viewer">
    <el-splitter>
      <el-splitter-panel v-if="imgList.size" :min="100" v-model:size="menuWidth" class="asset-image-viewer-panel">
        <el-scrollbar class="menu-scroll-view">
          <el-menu ref="menu" @select="handleSelect">
            <el-menu-item v-for="[key, item] in imgList" :key :index="key">
              <span class="img-name">{{ item.name }}</span>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </el-splitter-panel>
      <el-splitter-panel :min="200" class="asset-image-viewer-panel">
        <ImageViewer :src :name />
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup lang="ts">
import type { AssetInfo, AssetInfoData } from '@/workers/assetManager';
import ImageViewer from '@/components/ImageViewer.vue';
import { useLocalStorage } from '@vueuse/core';

type ImgItem = Extract<AssetInfoData, { type: 'imageList' }>['list'][number];

const { asset } = defineProps<{
  asset: AssetInfo;
}>();

const emits = defineEmits<{
  loadImage: [asset: AssetInfo, subKey?: string];
}>();

const menuRef = useTemplateRef('menu');

const menuWidth = useLocalStorage('asset-image-viewer-menu-width', 200);

const imgList = ref<Map<string, ImgItem>>(new Map());
const curSelectKey = ref<string>('');
const curSelectItem = computed(() => imgList.value.get(curSelectKey.value));

const data = computed(() => asset.data! as Extract<AssetInfoData, { type: 'image' | 'imageList' }>);
const src = computed(() => (data.value.type === 'imageList' ? curSelectItem.value?.url : data.value.url));
const name = computed(() => (data.value.type === 'imageList' ? curSelectItem.value?.name : asset.name));

const handleSelect = (key: string) => {
  curSelectKey.value = key;
};

watch(
  data,
  value => {
    // 单图
    if (value.type === 'image') {
      imgList.value.clear();
      if (value.url === undefined) emits('loadImage', asset);
      return;
    }

    // 多图
    imgList.value = new Map(value.list.map(item => [item.key, item]));
    if (!imgList.value.has(curSelectKey.value)) {
      curSelectKey.value = value.list[0].key;
    }
  },
  { immediate: true },
);

watch(
  curSelectItem,
  item => {
    if (item && item.url === undefined) {
      emits('loadImage', asset, curSelectKey.value);
    }
  },
  { immediate: true },
);

watch(
  [curSelectKey, menuRef],
  async ([key, menu]) => {
    await nextTick();
    // @ts-ignore
    menu?.updateActiveIndex(key);
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.asset-image-viewer {
  position: relative;
  width: 100%;
  height: 100%;

  :deep(.asset-image-viewer-panel) {
    position: relative;
    overflow: unset;
  }
}

.menu-scroll-view {
  --el-menu-item-height: 36px;
  position: absolute;
  inset: 0;
}

.img-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
