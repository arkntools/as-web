import type { BundleLoadOptions } from '@arkntools/unity-js';
import { proxy } from 'comlink';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { AssetInfo, FileLoadingError, FileLoadingProgress } from '@/workers/assetManager';

const worker = new ComlinkWorker<typeof import('@/workers/assetManager')>(
  new URL('../workers/assetManager.js', import.meta.url),
);
const manager = new worker.AssetManager();

export const useAssetManager = defineStore('assetManager', () => {
  const assetInfos = ref<AssetInfo[]>([]);
  const isLoading = ref(false);
  const fileLoadingErrors = ref<FileLoadingError[]>([]);
  const loadingProgress = ref<FileLoadingProgress>({});
  const curAssetInfo = ref<AssetInfo>();

  const assetInfoMap = computed(() => new Map(assetInfos.value.map(info => [info.key, info])));

  const onProgress = proxy((progress: FileLoadingProgress) => {
    Object.assign(loadingProgress.value, progress);
  });

  const loadFiles = async (files: File[], options?: BundleLoadOptions) => {
    isLoading.value = true;
    try {
      const { errors, infos } = await (await manager).loadFiles(files, options, onProgress);
      assetInfos.value = infos;
      fileLoadingErrors.value = errors;
    } catch (error) {
      fileLoadingErrors.value = [{ name: 'Error', error: String(error) }];
    } finally {
      isLoading.value = false;
      loadingProgress.value = {};
    }
  };

  const clearFiles = async () => {
    assetInfos.value = [];
    await (await manager).clear();
  };

  const loadImage = async ({ key, fileId, pathId }: Pick<AssetInfo, 'key' | 'fileId' | 'pathId'>) => {
    const img = await (await manager).getImageUrl(fileId, pathId);
    assetInfoMap.value.get(key)!.data = img ?? null;
  };

  const setCurAssetInfo = (info: AssetInfo) => {
    curAssetInfo.value = info;
  };

  return {
    assetInfos,
    assetInfoMap,
    isLoading,
    fileLoadingErrors,
    loadingProgress,
    curAssetInfo,
    loadFiles,
    clearFiles,
    loadImage,
    setCurAssetInfo,
  };
});
