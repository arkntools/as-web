import { AssetType, loadAssetBundle } from '@arkntools/unity-js';
import type { AssetObject, Bundle, BundleLoadOptions } from '@arkntools/unity-js';
import { expose } from 'comlink';
import { md5 as calcMd5 } from 'js-md5';
import { toTrackedPromise } from '@/utils/trackedPromise';
import type { TrackedPromise } from '@/utils/trackedPromise';

export interface AssetInfo {
  key: string;
  fileId: string;
  fileName: string;
  name: string;
  container: string;
  type: string;
  pathId: string;
  size: number;
  /** `undefined` means not loaded, `null` means error */
  data: string | null | undefined;
}

export interface FileLoadingError {
  name: string;
  error: string;
}

export interface FileLoadingProgress {
  name?: string;
  assetNum?: number;
}

const showAssetType = new Set([AssetType.TextAsset, AssetType.Sprite, AssetType.Texture2D]);
const assetTypeNameMap: Partial<Record<AssetType, string>> = {
  [AssetType.TextAsset]: 'TextAsset',
  [AssetType.Sprite]: 'Sprite',
  [AssetType.Texture2D]: 'Texture2D',
};

export class AssetManager {
  private bundleMap = new Map<string, Bundle>();
  private imageMap = new Map<string, TrackedPromise<{ url: string; blob: Blob } | undefined>>();
  private textDecoder = new TextDecoder('utf-8');

  clear() {
    this.bundleMap.clear();
    this.imageMap.forEach(async img => {
      const url = (await img)?.url;
      if (url) URL.revokeObjectURL(url);
    });
    this.imageMap.clear();
  }

  async loadFiles(files: File[], options?: BundleLoadOptions, onProgress?: (progress: FileLoadingProgress) => void) {
    const errors: Array<FileLoadingError> = [];
    const infos: AssetInfo[] = [];
    for (const file of files) {
      try {
        onProgress?.({ name: file.name });
        const result = await this.loadFile(file, options);
        if (result.length) infos.push(...result);
        onProgress?.({ assetNum: infos.length });
      } catch (error) {
        errors.push({ name: file.name, error: String(error) });
      }
    }
    return { errors, infos };
  }

  async getImageUrl(fileId: string, pathId: string) {
    return (await this.loadImage(fileId, pathId))?.url;
  }

  private getAssetObj(fileId: string, pathId: string) {
    return this.bundleMap.get(fileId)?.objectMap.get(pathId);
  }

  private async loadImage(fileId: string, pathId: string) {
    const key = this.getAssetKey(fileId, pathId);
    if (this.imageMap.has(key)) return this.imageMap.get(key);

    const obj = this.getAssetObj(fileId, pathId);
    if (!obj || (obj.type !== AssetType.Sprite && obj.type !== AssetType.Texture2D)) return;

    const result = (async () => {
      const image = await obj.getImage();
      if (!image) return;

      const blob = new Blob([image.buffer], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      return { blob, url };
    })();

    this.imageMap.set(key, toTrackedPromise(result));

    return result;
  }

  private async loadFile(file: File, options?: BundleLoadOptions) {
    const buffer = await file.arrayBuffer();
    const md5 = calcMd5(buffer);

    const fileInfo = { fileId: md5, fileName: file.name };
    const bundle = this.bundleMap.get(md5) ?? (await loadAssetBundle(buffer, options));
    if (!this.bundleMap.has(md5)) this.bundleMap.set(md5, bundle);

    return Promise.all(
      bundle.objects
        .filter(obj => showAssetType.has(obj.type))
        .map(async (obj): Promise<AssetInfo> => {
          const { name, type, pathId } = obj;
          const key = this.getAssetKey(fileInfo.fileId, pathId);
          return {
            key,
            name,
            container: bundle.containerMap?.get(pathId) ?? '',
            type: assetTypeNameMap[type] ?? '',
            pathId,
            size: 0, // TODO size
            data: await this.getAssetData(obj, key),
            ...fileInfo,
          };
        }),
    );
  }

  private async getAssetData(obj: AssetObject, key: string) {
    try {
      switch (obj.type) {
        case AssetType.TextAsset:
          return this.textDecoder.decode(obj.data);
        case AssetType.Sprite:
        case AssetType.Texture2D: {
          const imgPromise = this.imageMap.get(key);
          if (imgPromise?.isFulfilled()) {
            return (await imgPromise)?.url ?? null;
          }
          break;
        }
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private getAssetKey(fileId: string, pathId: string) {
    return `${fileId},${pathId}`;
  }
}
