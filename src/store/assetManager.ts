import { proxy, transfer, wrap } from 'comlink';
import { defineStore } from 'pinia';
import { showNotingCanBeExportToast } from '@/utils/toasts';
import type { AssetInfo, ExportAssetsOnProgress, FileLoadingOnProgress } from '@/workers/assetManager';
import AssetManagerWorker from '@/workers/assetManager/index.js?worker';
import { useProgress } from './progress';
import { useSetting } from './setting';

const { AssetManager } = wrap<typeof import('@/workers/assetManager')>(new AssetManagerWorker());

AssetManager.setFsbToMp3(
  proxy(async params => {
    const { convertFsb, FsbConvertFormat } = await import('@arkntools/unity-js/audio');
    const data = await convertFsb(params, FsbConvertFormat.MP3);
    return transfer(data, [data.buffer]);
  }),
);

const manager = new AssetManager();

const pickExportDir = () => window.showDirectoryPicker({ id: 'export-assets', mode: 'readwrite' }).catch(console.error);

const showExportResultMessage = (
  { success, skip, error }: { success: number; skip: number; error: number } = { success: 0, skip: 0, error: 0 },
) => {
  const parts: string[] = [`Exported ${success} file${success > 1 ? 's' : ''}`];
  if (skip) parts.push(`skipped ${skip}`);
  if (error) parts.push(`failed ${error}`);
  ElMessage({
    message: parts.join(', '),
    type: success ? 'success' : skip ? 'warning' : error ? 'error' : 'info',
  });
};

export const useAssetManager = defineStore('assetManager', () => {
  const progressStore = useProgress();
  const setting = useSetting();

  const assetInfos = shallowRef<AssetInfo[]>([]);
  const curAssetInfo = shallowRef<AssetInfo>();
  const isLoading = ref(false);

  const assetInfoMap = computed(() => new Map(assetInfos.value.map(info => [info.key, info])));

  const canExport = ({ canExport }: AssetInfo) => canExport;

  const onProgress = proxy<FileLoadingOnProgress>(({ name, progress, totalAssetNum }) => {
    progressStore.setProgress({
      type: 'loading',
      value: progress,
      desc: `Loading ${name}, total assets: ${totalAssetNum}`,
    });
  });

  const loadFiles = async (files: File[]) => {
    isLoading.value = true;
    try {
      const { errors, infos, successNum } = await (
        await manager
      ).loadFiles(
        files,
        {
          unityCNKey: setting.unityCNKey,
          env: setting.data.unityEnv,
        },
        onProgress,
      );
      if (infos.length) {
        assetInfos.value = infos;
        curAssetInfo.value = undefined;
        ElMessage({
          message: `Loaded ${infos.length} assets from ${successNum} files`,
          type: 'success',
        });
      }
      if (files.length === 1 && errors.length) {
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
      progressStore.clearProgress();
    }
  };

  const clearFiles = async () => {
    assetInfos.value = [];
    await (await manager).clear();
  };

  const loadPreviewData = async ({ fileId, pathId }: Pick<AssetInfo, 'fileId' | 'pathId'>, payload?: any) =>
    (await manager).getPreviewData(fileId, pathId, payload);

  const setCurAssetInfo = (info: AssetInfo) => {
    curAssetInfo.value = info;
  };

  const exportAsset = async ({ fileId, pathId, canExport }: AssetInfo) => {
    if (!canExport) {
      showNotingCanBeExportToast();
      return;
    }
    const handle = await pickExportDir();
    if (!handle) return;
    showExportResultMessage(await (await manager).exportAsset(handle, fileId, pathId));
  };

  const isBatchExporting = ref(false);

  const batchExportOnProgress = proxy<ExportAssetsOnProgress>(({ progress, name }) => {
    progressStore.setProgress({
      value: progress * 100,
      desc: `Exporting ${name}`,
    });
  });

  const batchExportAsset = async (infos: AssetInfo[]) => {
    if (isBatchExporting.value) return;
    isBatchExporting.value = true;
    try {
      const handle = await pickExportDir();
      if (!handle) return;
      progressStore.setProgress({
        type: 'exporting',
        desc: 'Exporting',
      });
      showExportResultMessage(
        await (
          await manager
        ).exportAssets(
          handle,
          infos.map(({ fileId, pathId, fileName }) => ({ fileId, pathId, fileName })),
          { groupMethod: setting.data.exportGroupMethod },
          batchExportOnProgress,
        ),
      );
      progressStore.setProgress({
        value: 100,
        desc: '',
      });
    } catch (error) {
      console.error(error);
    } finally {
      isBatchExporting.value = false;
      progressStore.clearProgress();
    }
  };

  const exportAllAssets = async () => {
    const canExportAssets = assetInfos.value.filter(canExport);
    if (!canExportAssets.length) {
      showNotingCanBeExportToast();
      return;
    }
    await batchExportAsset(assetInfos.value);
  };

  return {
    assetInfos,
    assetInfoMap,
    curAssetInfo,
    isLoading,
    isBatchExporting,
    loadFiles,
    clearFiles,
    loadPreviewData,
    setCurAssetInfo,
    exportAsset,
    batchExportAsset,
    exportAllAssets,
    canExport,
  };
});
