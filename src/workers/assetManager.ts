import { AssetType, loadAssetBundle, MonoBehaviourAtlasSprite } from '@arkntools/unity-js';
import type {
  AssetObject,
  Bundle,
  BundleLoadOptions,
  ImgBitMap,
  MonoBehaviour,
  Sprite,
  TextAsset,
  Texture2D,
} from '@arkntools/unity-js';
import { proxy, releaseProxy, transfer } from 'comlink';
import { groupBy } from 'es-toolkit';
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
  typeTree: Record<string, any>;
  dump: Record<string, any>;
  data: AssetInfoData | null;
  search: string;
  canExport: boolean;
}

export type AssetInfoData =
  | {
      type: 'text';
      data: string;
    }
  | {
      type: 'image';
      /** `undefined` means not loaded, `null` means error */
      url?: string | null;
    }
  | {
      type: 'imageList';
      list: Array<{
        key: string;
        name: string;
        /** `undefined` means not loaded, `null` means error */
        url?: string | null;
      }>;
    };

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

const showAssetType = new Set([
  AssetType.TextAsset,
  AssetType.Sprite,
  AssetType.SpriteAtlas,
  AssetType.Texture2D,
  AssetType.MonoBehaviour,
]);

export type MonoBehaviourWithSprites = MonoBehaviour & Required<Pick<MonoBehaviour, 'sprites'>>;
export type ImageAssetObj = Sprite | Texture2D | MonoBehaviourWithSprites;
export type ExportableAssetObject = TextAsset | ImageAssetObj;

const isMonoBehaviourSprite = (obj?: unknown) => obj instanceof MonoBehaviourAtlasSprite;
const isMonoBehaviourWithSprites = (obj?: AssetObject): obj is MonoBehaviourWithSprites =>
  !!(obj && obj.type === AssetType.MonoBehaviour && obj.sprites?.length);
const isTextAssetObj = (obj?: AssetObject): obj is TextAsset => obj?.type === AssetType.TextAsset;
const isImageAssetObj = (obj?: AssetObject): obj is ImageAssetObj =>
  !!(obj && (obj.type === AssetType.Sprite || obj.type === AssetType.Texture2D || isMonoBehaviourWithSprites(obj)));
const isExportableAssetObj = (obj?: AssetObject): obj is ExportableAssetObject =>
  isTextAssetObj(obj) || isImageAssetObj(obj);

const getLegalFileName = (name: string) => name.replace(/[/\\:*?"<>|]/g, '');
const getAssetObjLegalFileName = ({ name, type, pathId }: AssetObject) =>
  name ? getLegalFileName(name) : `${AssetType[type]}#${pathId}`;

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

  async loadFiles(files: File[], options: BundleLoadOptions, onProgress: FileLoadingOnProgress) {
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

  async getImageUrl(fileId: string, pathId: bigint, subKey?: string) {
    return (await this.loadImage(fileId, pathId, subKey))?.url ?? null;
  }

  async exportAsset(fileId: string, pathId: bigint) {
    const obj = this.getAssetObj(fileId, pathId);
    if (!obj || !isExportableAssetObj(obj)) return;
    const fileName = getAssetObjLegalFileName(obj);
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
        break;
      }
      case AssetType.MonoBehaviour: {
        const zip = await new this.zipWorker.Zip();
        await Promise.all(
          obj.sprites.map(async sprite => {
            const buffer = await this.getAssetObjPNG(sprite);
            if (buffer) {
              zip.add({ name: `${sprite.name}.png`, data: buffer });
            }
          }),
        );
        const buffer = await zip.generate();
        zip[releaseProxy]();
        if (buffer) {
          return transfer(
            {
              name: `${fileName}.zip`,
              type: 'application/zip',
              data: buffer,
            },
            [buffer],
          );
        }
        break;
      }
    }
  }

  async exportAssets(
    params: Array<{ fileId: string; pathId: bigint; fileName: string; container: string }>,
    { groupMethod }: { groupMethod: ExportGroupMethod },
    onProgress: ExportAssetsOnProgress,
  ) {
    const zip = await new this.zipWorker.Zip();
    const infoMap = new Map<
      string,
      {
        key: string;
        fileName: string;
        container: string;
        parent?: MonoBehaviourWithSprites;
        obj: Exclude<ExportableAssetObject, MonoBehaviourWithSprites> | MonoBehaviourAtlasSprite;
      }
    >(
      params.flatMap(({ fileId, pathId, fileName, container }): any => {
        const obj = this.getAssetObj(fileId, pathId);
        if (!isExportableAssetObj(obj)) return [];
        const key = this.getAssetKey(fileId, pathId);
        if (isMonoBehaviourWithSprites(obj)) {
          return obj.sprites.map(sprite => {
            const fullKey = this.getSubAssetKey(key, sprite.guid);
            return [fullKey, { key: fullKey, fileName, container, parent: obj, obj: sprite }];
          });
        }
        return [[key, { key, fileName, container, obj }]];
      }),
    );
    const getObjName = (key: string) => {
      const info = infoMap.get(key);
      if (!info) return '';
      const { parent, obj } = info;
      return parent ? `${parent.name}/${obj.name}` : obj.name;
    };
    const getObjPath = (key: string, ext: string) => {
      const info = infoMap.get(key);
      if (!info) return '';
      const { obj, fileName, container, parent } = info;
      const parts = [isMonoBehaviourSprite(obj) ? getLegalFileName(obj.name) : getAssetObjLegalFileName(obj)];
      if (parent) parts.push(getAssetObjLegalFileName(parent));
      switch (groupMethod) {
        case ExportGroupMethod.CONTAINER_PATH:
          if (container) {
            parts.push(container);
            break;
          }
        // eslint-disable-next-line no-fallthrough
        case ExportGroupMethod.NONE:
          break;
        case ExportGroupMethod.TYPE_NAME:
          if (isMonoBehaviourSprite(obj)) {
            if (parent) parts.push(AssetType[parent.type]);
            break;
          }
          parts.push(AssetType[obj.type]);
          break;
        case ExportGroupMethod.SOURCE_FILE_NAME:
          parts.push(fileName);
          break;
      }
      return `${parts.reverse().join('/')}.${ext}`;
    };

    const infos = [...infoMap.values()];
    const { imageInfos = [], textInfos = [] } = groupBy(infos, ({ obj }) => {
      if (isMonoBehaviourSprite(obj)) return 'imageInfos';
      if (isTextAssetObj(obj)) return 'textInfos';
      return 'imageInfos';
    });

    const imgData: Array<{ key: string; blob: Blob }> = [];
    const imgBitmaps: Array<{ key: string; bitmap: ImgBitMap }> = [];
    let lastPrepareUpdateTs = 0;

    const updatePrepareProgress = (i: number, key: string) => {
      const now = Date.now();
      if (now - lastPrepareUpdateTs < 50) return;
      lastPrepareUpdateTs = now;
      onProgress({ type: 'exportPreparing', percent: (i / imageInfos.length) * 100, name: getObjName(key) });
    };
    for (const [i, { key, obj }] of imageInfos.entries()) {
      const imgObj = obj as Exclude<typeof obj, TextAsset>;
      updatePrepareProgress(i, imgObj.name);
      const image = this.imageMap.get(key);
      if (image?.isFulfilled()) {
        const blob = (await image)?.blob;
        if (blob) {
          imgData.push({ key, blob });
          continue;
        }
      }
      const bitmap = imgObj.getImageBitmap();
      if (bitmap) {
        imgBitmaps.push({ key, bitmap });
      }
    }

    const total = imgData.length + imgBitmaps.length + (textInfos.length ? 1 : 0);
    let complete = 0;

    const imageConvertPromise = imgBitmaps.length
      ? this.imageConverter.addTasks(imgBitmaps, ({ key, data }) => {
          if (!this.imageMap.has(key)) {
            const blob = new Blob([data], { type: 'image/png' });
            this.imageMap.set(key, toTrackedPromise(Promise.resolve({ blob, url: URL.createObjectURL(blob) })));
          }
          zip.add({ name: getObjPath(key, 'png'), data });
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
    if (textInfos.length) {
      textInfos.forEach(({ key, obj }) => {
        zip.add({ name: getObjPath(key, 'txt'), data: (obj as TextAsset).data });
      });
      onProgress({ type: 'exportAsset', percent: (++complete / total) * 100, name: `${textInfos.length} TextAsset` });
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

  private async loadImage(fileId: string, pathId: bigint, subKey?: string) {
    const key = this.getAssetKey(fileId, pathId);
    const fullKey = subKey ? this.getSubAssetKey(key, subKey) : key;
    if (this.imageMap.has(fullKey)) return this.imageMap.get(fullKey);

    const obj = this.getAssetObj(fileId, pathId);
    if (!isImageAssetObj(obj)) return;

    const targetObj = obj.type === AssetType.MonoBehaviour ? obj.sprites.find(sprite => sprite.guid === subKey) : obj;
    if (!targetObj) return;

    const result = (async () => {
      const timeLabel = `[AssetManager] load image ${obj.name}`;
      console.time(timeLabel);
      const buffer = await this.getAssetObjPNG(targetObj);
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
          return {
            ...fileInfo,
            key,
            name,
            container: bundle.getContainer(pathId) ?? '',
            type: AssetType[type] ?? '',
            pathId,
            size,
            typeTree: obj.getTypeTree(),
            dump: obj.dump(),
            data: await this.getAssetData(obj, key),
            search: name.toLowerCase(),
            canExport: isExportableAssetObj(obj),
          };
        }),
    );
  }

  private async getAssetData(obj: AssetObject, key: string): Promise<AssetInfoData | null> {
    try {
      switch (obj.type) {
        case AssetType.TextAsset:
          return {
            type: 'text',
            data: this.textDecoder.decode(obj.data),
          };
        case AssetType.Sprite:
        case AssetType.Texture2D:
          return {
            type: 'image',
            url: await this.getImageUrlFromMap(key),
          };
        case AssetType.MonoBehaviour:
          if (!obj.sprites?.length) return null;
          return {
            type: 'imageList',
            list: await Promise.all(
              obj.sprites.map(async sprite => ({
                key: sprite.guid,
                name: sprite.name,
                url: await this.getImageUrlFromMap(this.getSubAssetKey(key, sprite.guid)),
              })),
            ),
          };
      }
    } catch (error) {
      console.error(error);
    }
    return null;
  }

  private getAssetKey(fileId: string, pathId: bigint) {
    return `${fileId}_${pathId}`;
  }

  private getSubAssetKey(key: string, subKey: string) {
    return `${key}_${subKey}`;
  }

  private async getImageUrlFromMap(key: string) {
    const imgPromise = this.imageMap.get(key);
    if (imgPromise?.isFulfilled()) {
      return (await imgPromise)?.url ?? null;
    }
  }
}
