import type { BundleLoadOptions } from '@arkntools/unity-js';
import { proxy } from 'comlink';
import { saveAs } from 'file-saver';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getDateString } from '@/utils/date';
import type { AssetInfo, ExportAssetsOnProgress, FileLoadingProgress } from '@/workers/assetManager';

const worker = new ComlinkWorker<typeof import('@/workers/assetManager')>(
  new URL('../workers/assetManager.js', import.meta.url),
);
const manager = new worker.AssetManager();

export const useAssetManager = defineStore('assetManager', () => {
  const assetInfos = ref<AssetInfo[]>([]);
  const isLoading = ref(false);
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
      infos.forEach(({ dump }) => {
        markRaw(dump);
      });
      if (infos.length) assetInfos.value = infos;
      if (errors.length) {
        errors.forEach(({ name, error }) => {
          ElMessage({
            message: `Failed to load ${name}: ${error}`,
            type: 'error',
          });
        });
      }
    } catch (error) {
      ElMessage({
        message: `Failed to load: ${error}`,
        type: 'error',
      });
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

  const exportAsset = async ({ name, fileId, pathId }: Pick<AssetInfo, 'name' | 'fileId' | 'pathId'>) => {
    const file = await (await manager).exportAsset(fileId, pathId);
    if (!file) {
      ElMessage({
        message: `Export ${name} failed`,
        type: 'error',
        grouping: true,
      });
      return;
    }
    saveAs(new Blob([file.data], { type: file.type }), file.name);
  };

  const isBatchExporting = ref(false);
  const batchExportProgress = ref(0);
  const batchExportProgressType = ref('');
  const batchExportDescription = ref('');
  const isBatchExportPreparing = computed(() => batchExportProgressType.value === 'prepare');

  const batchExportOnProgress = proxy<ExportAssetsOnProgress>(({ type, percent, name }) => {
    batchExportProgress.value = percent;
    batchExportProgressType.value = type;
    switch (type) {
      case 'asset':
        batchExportDescription.value = `Exporting ${name}`;
        break;
      case 'zip':
        batchExportDescription.value = `Packing ${name}`;
        break;
    }
  });

  const batchExportAsset = async (infos: Array<Pick<AssetInfo, 'fileId' | 'pathId'>>) => {
    if (isBatchExporting.value) return;
    isBatchExporting.value = true;
    batchExportProgress.value = 0;
    batchExportProgressType.value = 'prepare';
    batchExportDescription.value = 'Preparing';
    try {
      const zip = await (
        await manager
      ).exportAssets(
        infos.map(({ fileId, pathId }) => ({ fileId, pathId })),
        batchExportOnProgress,
      );
      batchExportProgress.value = 100;
      batchExportDescription.value = '';
      saveAs(new Blob([zip], { type: 'application/zip' }), `export-${getDateString()}.zip`);
    } catch (error) {
      console.error(error);
    } finally {
      isBatchExporting.value = false;
    }
  };

  return {
    assetInfos,
    assetInfoMap,
    isLoading,
    loadingProgress,
    curAssetInfo,
    isBatchExporting,
    batchExportProgress,
    batchExportProgressType,
    batchExportDescription,
    isBatchExportPreparing,
    loadFiles,
    clearFiles,
    loadImage,
    setCurAssetInfo,
    exportAsset,
    batchExportAsset,
  };
});
