import { AssetType, loadAssetBundle } from '@arkntools/unity-js';
import type {
  AssetObject,
  Bundle,
  BundleLoadOptions,
  ImgBitMap,
  Sprite,
  TextAsset,
  Texture2D,
} from '@arkntools/unity-js';
import { proxy, releaseProxy, transfer } from 'comlink';
import { md5 as calcMd5 } from 'js-md5';
import type { OnUpdateCallback } from 'jszip';
import { toTrackedPromise } from '@/utils/trackedPromise';
import type { TrackedPromise } from '@/utils/trackedPromise';
import { ImageConverterPool } from './utils/imageConverterPool';

export interface AssetInfo {
  key: string;
  fileId: string;
  fileName: string;
  name: string;
  container: string;
  type: string;
  pathId: bigint;
  size: number;
  dump: Record<string, any>;
  /** `undefined` means not loaded, `null` means error */
  data: string | null | undefined;
  search: string;
}

export interface FileLoadingError {
  name: string;
  error: string;
}

export interface FileLoadingProgress {
  name?: string;
  assetNum?: number;
}

export type ExportAssetsOnProgress = (param: { type: 'asset' | 'zip'; percent: number; name: string }) => any;

type ZipModule = typeof import('./zip');

const showAssetType = new Set([AssetType.TextAsset, AssetType.Sprite, AssetType.Texture2D]);
const isTextAssetObj = (obj?: AssetObject): obj is TextAsset => obj?.type === AssetType.TextAsset;
const isImageAssetObj = (obj?: AssetObject): obj is Sprite | Texture2D =>
  !!obj && (obj.type === AssetType.Sprite || obj.type === AssetType.Texture2D);

export class AssetManager {
  private bundleMap = new Map<string, Bundle>();
  private imageMap = new Map<string, TrackedPromise<{ url: string; blob: Blob } | undefined>>();
  private textDecoder = new TextDecoder('utf-8');
  private imageConverter = new ImageConverterPool();
  private _zipWorker!: InstanceType<typeof ComlinkWorker<ZipModule>>;

  private get zipWorker() {
    if (this._zipWorker) return this._zipWorker;
    const worker = new ComlinkWorker<ZipModule>(new URL('./zip.js', import.meta.url));
    this._zipWorker = worker;
    return worker;
  }

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
        const timeLabel = `[AssetManager] load ${file.name}`;
        console.time(timeLabel);
        const result = await this.loadFile(file, options);
        console.timeEnd(timeLabel);
        console.log(`[AssetManager] ${result.length} assets loaded from ${file.name}`);
        if (result.length) infos.push(...result);
        onProgress?.({ assetNum: infos.length });
      } catch (error) {
        errors.push({ name: file.name, error: String(error) });
        console.error(`[AssetManager] failed to load ${file.name}`);
        console.error(error);
      }
    }
    return { errors, infos };
  }

  async getImageUrl(fileId: string, pathId: bigint) {
    return (await this.loadImage(fileId, pathId))?.url;
  }

  async exportAsset(fileId: string, pathId: bigint) {
    const obj = this.getAssetObj(fileId, pathId);
    if (!obj) return;
    const fileName = obj.name.replace(/[/\\:*?"<>|]/g, '');
    switch (obj.type) {
      case AssetType.TextAsset:
        return {
          name: `${fileName}.txt`,
          type: 'text/plain',
          data: obj.data,
        };
      case AssetType.Sprite:
      case AssetType.Texture2D: {
        const buffer = await (await this.loadImage(fileId, pathId))?.blob.arrayBuffer();
        if (buffer) {
          return transfer(
            {
              name: `${fileName}.png`,
              type: 'image/png',
              data: buffer,
            },
            [buffer],
          );
        }
      }
    }
  }

  async exportAssets(params: Array<{ fileId: string; pathId: bigint }>, onProgress: ExportAssetsOnProgress) {
    const zip = await new this.zipWorker.Zip();
    const objs = params.map(({ fileId, pathId }) => ({ fileId, obj: this.getAssetObj(fileId, pathId) }));
    const textObjs = objs.filter((obj): obj is { fileId: string; obj: TextAsset } => isTextAssetObj(obj.obj));
    const imgData: Array<{ name: string; blob: Blob }> = [];
    const imgBitmaps: Array<{ name: string; bitmap: ImgBitMap }> = [];
    for (const { fileId, obj } of objs) {
      if (!isImageAssetObj(obj)) continue;
      const key = this.getAssetKey(fileId, obj.pathId);
      const image = this.imageMap.get(key);
      if (image?.isFulfilled()) {
        const blob = (await image)?.blob;
        if (blob) {
          imgData.push({ name: obj.name, blob });
          continue;
        }
      }
      const bitmap = obj.getImageBitmap();
      if (bitmap) {
        imgBitmaps.push({ name: obj.name, bitmap });
      }
    }
    const total = imgData.length + imgBitmaps.length + (textObjs.length ? 1 : 0);
    let complete = 0;
    const imageConvertPromise = imgBitmaps.length
      ? this.imageConverter.addTasks(imgBitmaps, ({ name, data }) => {
          zip.add(transfer({ name: `${name}.png`, data }, [data]));
          onProgress({ type: 'asset', percent: (++complete / total) * 100, name });
        })
      : null;
    if (imgData.length) {
      await Promise.allSettled(
        imgData.map(async ({ name, blob }) => {
          zip.add({ name: `${name}.png`, data: await blob.arrayBuffer() });
        }),
      );
      complete += imgData.length;
      onProgress({ type: 'asset', percent: (complete / total) * 100, name: `${imgData.length} cached images` });
    }
    if (textObjs.length) {
      textObjs.forEach(({ obj }) => {
        zip.add({ name: `${obj.name}.txt`, data: obj.data });
      });
      onProgress({ type: 'asset', percent: (++complete / total) * 100, name: `${textObjs.length} TextAsset` });
    }
    await imageConvertPromise;
    const buffer = await zip.generate(
      undefined,
      proxy<OnUpdateCallback>(({ percent, currentFile }) => {
        onProgress({ type: 'zip', percent, name: currentFile || '' });
      }),
    );
    zip[releaseProxy]();
    return transfer(buffer, [buffer]);
  }

  private getAssetObj(fileId: string, pathId: bigint) {
    return this.bundleMap.get(fileId)?.objectMap.get(pathId);
  }

  private async loadImage(fileId: string, pathId: bigint) {
    const key = this.getAssetKey(fileId, pathId);
    if (this.imageMap.has(key)) return this.imageMap.get(key);

    const obj = this.getAssetObj(fileId, pathId);
    if (!obj || (obj.type !== AssetType.Sprite && obj.type !== AssetType.Texture2D)) return;

    const result = (async () => {
      const timeLabel = `[AssetManager] load image ${obj.name}`;
      console.time(timeLabel);
      const buffer = await this.getAssetObjPNG(obj);
      console.timeEnd(timeLabel);
      if (!buffer) return;

      const blob = new Blob([buffer], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      return { blob, url };
    })();

    this.imageMap.set(key, toTrackedPromise(result));

    return result;
  }

  private async getAssetObjPNG(obj: { getImageBitmap: () => ImgBitMap | undefined }) {
    const bitmap = obj.getImageBitmap();
    if (!bitmap) return;
    let buffer: ArrayBuffer | undefined;
    await this.imageConverter.addTasks([{ name: '', bitmap }], ({ data }) => {
      buffer = data;
    });
    if (buffer) return buffer;
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
          const { name, type, pathId, size } = obj;
          const key = this.getAssetKey(fileInfo.fileId, pathId);
          const container = bundle.containerMap?.get(pathId) ?? '';
          return {
            ...fileInfo,
            key,
            name,
            container,
            type: AssetType[type] ?? '',
            pathId,
            size,
            dump: obj.dump(),
            data: await this.getAssetData(obj, key),
            search: name.toLowerCase(),
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

  private getAssetKey(fileId: string, pathId: bigint) {
    return `${fileId}_${pathId}`;
  }
}
