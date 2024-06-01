import type { Bundle, BundleLoadOptions } from '@arkntools/unity-js';
import { AssetType, loadAssetBundle } from '@arkntools/unity-js';
import { md5 as calcMd5 } from 'js-md5';

export interface AssetInfo {
  fileId: string;
  fileName: string;
  name: string;
  container: string;
  type: string;
  pathId: string;
  size: number;
}

const showAssetType = new Set([AssetType.TextAsset, AssetType.Sprite, AssetType.Texture2D]);
const assetTypeNameMap: Partial<Record<AssetType, string>> = {
  [AssetType.TextAsset]: 'TextAsset',
  [AssetType.Sprite]: 'Sprite',
  [AssetType.Texture2D]: 'Texture2D',
};

export class AssetManager {
  private bundleMap = new Map<string, Bundle>();
  private imageMap = new Map<string, { url: string; blob: Blob }>();

  clear() {
    this.bundleMap.clear();
    this.imageMap.forEach(({ url }) => {
      URL.revokeObjectURL(url);
    });
    this.imageMap.clear();
  }

  async loadFiles(files: File[], options?: BundleLoadOptions) {
    const errors: Array<{ name: string; error: Error }> = [];
    const infos = (
      await Promise.all(
        files.map(async file => {
          try {
            const info = await this.loadFile(file, options);
            if (info) return info;
          } catch (error: any) {
            errors.push({ name: file.name, error });
          }
          return [];
        }),
      )
    ).flat();
    return { errors, infos };
  }

  async getImageUrl(fileId: string, pathId: string) {
    return (await this.loadImage(fileId, pathId))?.url;
  }

  async getData(fileId: string, pathId: string) {
    const obj = this.getAssetObj(fileId, pathId);
    if (obj?.type === AssetType.TextAsset) return obj.data;
  }

  private getAssetObj(fileId: string, pathId: string) {
    return this.bundleMap.get(fileId)?.objectMap.get(pathId);
  }

  private async loadImage(fileId: string, pathId: string) {
    const key = `${fileId},${pathId}`;
    if (this.imageMap.has(key)) return this.imageMap.get(key);

    const obj = this.getAssetObj(fileId, pathId);
    if (!obj || (obj.type !== AssetType.Sprite && obj.type !== AssetType.Texture2D)) return;

    const image = await obj.getImage();
    if (!image) return;

    const blob = new Blob([image.buffer], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const result = { blob, url };
    this.imageMap.set(key, result);

    return result;
  }

  private async loadFile(file: File, options?: BundleLoadOptions) {
    const buffer = await file.arrayBuffer();
    const md5 = calcMd5(buffer);

    const fileInfo = { fileId: md5, fileName: file.name };
    const bundle = this.bundleMap.get(md5) ?? (await loadAssetBundle(buffer, options));
    if (!this.bundleMap.has(md5)) this.bundleMap.set(md5, bundle);

    return bundle.objects
      .filter(obj => showAssetType.has(obj.type))
      .map(
        ({ name, type, pathId }): AssetInfo => ({
          name,
          container: bundle.containerMap?.get(pathId) ?? '',
          type: assetTypeNameMap[type] ?? '',
          pathId,
          size: 0, // TODO size
          ...fileInfo,
        }),
      );
  }
}
