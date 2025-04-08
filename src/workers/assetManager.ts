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
import { ExportGroupMethod } from '@/types/export';
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

export type FileLoadingOnProgress = (param: { name: string; progress: number; totalAssetNum: number }) => any;

export type ExportAssetsOnProgress = (param: {
  type: 'exportPreparing' | 'exportAsset' | 'exportZip';
  percent: number;
  name: string;
}) => any;

type ZipModule = typeof import('./zip');

const showAssetType = new Set([AssetType.TextAsset, AssetType.Sprite, AssetType.SpriteAtlas, AssetType.Texture2D]);
const canExportAssetType = new Set([AssetType.TextAsset, AssetType.Sprite, AssetType.Texture2D]);
const isTextAssetObj = (obj?: AssetObject): obj is TextAsset => obj?.type === AssetType.TextAsset;
const isImageAssetObj = (obj?: AssetObject): obj is Sprite | Texture2D =>
  !!obj && (obj.type === AssetType.Sprite || obj.type === AssetType.Texture2D);

const getLegalFileName = (name: string) => name.replace(/[/\\:*?"<>|]/g, '');

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

  getCanExportAssetTypes() {
    return [...canExportAssetType.values()].map(type => AssetType[type]);
  }

  async loadFiles(files: File[], options: BundleLoadOptions, onProgress: FileLoadingOnProgress) {
    console.log('options: ', options);
    const errors: Array<FileLoadingError> = [];
    const infos: AssetInfo[] = [];
    let successNum = 0;
    for (const [i, file] of files.entries()) {
      try {
        onProgress({
          name: file.name,
          progress: (i / files.length) * 100,
          totalAssetNum: infos.length,
        });
        const timeLabel = `[AssetManager] load ${file.name}`;
        console.time(timeLabel);
        const result = await this.loadFile(file, options);
        console.timeEnd(timeLabel);
        console.log(`[AssetManager] ${result.length} assets loaded from ${file.name}`);
        if (result.length) {
          successNum++;
          infos.push(...result);
        }
      } catch (error) {
        errors.push({ name: file.name, error: String(error) });
        console.error(`[AssetManager] failed to load ${file.name}`);
        console.error(error);
      }
    }
    return { errors, infos, successNum };
  }

  async getImageUrl(fileId: string, pathId: bigint) {
    return (await this.loadImage(fileId, pathId))?.url;
  }

  async exportAsset(fileId: string, pathId: bigint) {
    const obj = this.getAssetObj(fileId, pathId);
    if (!obj || !canExportAssetType.has(obj.type)) return;
    const fileName = getLegalFileName(obj.name);
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

  async exportAssets(
    params: Array<{ fileId: string; pathId: bigint; fileName: string; container: string }>,
    { groupMethod }: { groupMethod: ExportGroupMethod },
    onProgress: ExportAssetsOnProgress,
  ) {
    const zip = await new this.zipWorker.Zip();
    const objMap = new Map(
      params.map(({ fileId, pathId, fileName, container }) => {
        const key = this.getAssetKey(fileId, pathId);
        return [key, { key, fileName, container, obj: this.getAssetObj(fileId, pathId) }];
      }),
    );
    const getObjName = (key: string) => objMap.get(key)?.obj?.name ?? '';
    const getObjPath = (key: string, ext: string) => {
      const data = objMap.get(key);
      if (!data?.obj) return '';
      const { obj, fileName, container } = data;
      const legalName = getLegalFileName(obj.name);
      switch (groupMethod) {
        case ExportGroupMethod.CONTAINER_PATH:
          if (container) return container;
        // eslint-disable-next-line no-fallthrough
        case ExportGroupMethod.NONE:
          return `${legalName}.${ext}`;
        case ExportGroupMethod.TYPE_NAME:
          return `${AssetType[obj.type]}/${legalName}.${ext}`;
        case ExportGroupMethod.SOURCE_FILE_NAME:
          return `${fileName}/${legalName}.${ext}`;
      }
    };

    const objs = [...objMap.values()];
    const textObjs = objs.filter(obj => isTextAssetObj(obj.obj));

    const imgData: Array<{ key: string; blob: Blob }> = [];
    const imgBitmaps: Array<{ key: string; bitmap: ImgBitMap }> = [];
    let lastPrepareUpdateTs = 0;

    const imgObjs = objs.filter(({ obj }) => isImageAssetObj(obj)) as Array<{
      key: string;
      obj: Texture2D | Sprite;
    }>;
    const updatePrepareProgress = (i: number, key: string) => {
      const now = Date.now();
      if (now - lastPrepareUpdateTs < 50) return;
      lastPrepareUpdateTs = now;
      onProgress({ type: 'exportPreparing', percent: (i / imgObjs.length) * 100, name: getObjName(key) });
    };
    for (const [i, { key, obj }] of imgObjs.entries()) {
      updatePrepareProgress(i, obj.name);
      const image = this.imageMap.get(key);
      if (image?.isFulfilled()) {
        const blob = (await image)?.blob;
        if (blob) {
          imgData.push({ key, blob });
          continue;
        }
      }
      const bitmap = obj.getImageBitmap();
      if (bitmap) {
        imgBitmaps.push({ key, bitmap });
      }
    }

    const total = imgData.length + imgBitmaps.length + (textObjs.length ? 1 : 0);
    let complete = 0;

    const imageConvertPromise = imgBitmaps.length
      ? this.imageConverter.addTasks(imgBitmaps, ({ key, data }) => {
          zip.add(transfer({ name: getObjPath(key, 'png'), data }, [data]));
          onProgress({ type: 'exportAsset', percent: (++complete / total) * 100, name: getObjName(key) });
        })
      : null;
    if (imgData.length) {
      await Promise.allSettled(
        imgData.map(async ({ key, blob }) => {
          zip.add({ name: getObjPath(key, 'png'), data: await blob.arrayBuffer() });
        }),
      );
      complete += imgData.length;
      onProgress({ type: 'exportAsset', percent: (complete / total) * 100, name: `${imgData.length} cached images` });
    }
    if (textObjs.length) {
      textObjs.forEach(({ key, obj }) => {
        zip.add({ name: getObjPath(key, 'txt'), data: (obj as TextAsset).data });
      });
      onProgress({ type: 'exportAsset', percent: (++complete / total) * 100, name: `${textObjs.length} TextAsset` });
    }

    await imageConvertPromise;

    const buffer = await zip.generate(
      undefined,
      proxy<OnUpdateCallback>(({ percent, currentFile }) => {
        onProgress({ type: 'exportZip', percent, name: currentFile || '' });
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
    await this.imageConverter.addTasks([{ key: '', bitmap }], ({ data }) => {
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
