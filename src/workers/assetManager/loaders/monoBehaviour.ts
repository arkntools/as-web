import type { ImgBitMap, MonoBehaviour } from '@arkntools/unity-js';
import { imageConverterPool } from '@/workers/utils/imageConverterPool';
import { blobCache, spineCache, SpineItemType } from '../utils/cache';
import type { BlobItem, CacheKey, SpineItem } from '../utils/cache';
import { getLegalFileName } from '../utils/path';
import { AssetLoader, PreviewType } from './default';
import type { AssetExportItem, PreviewDetail } from './default';

export interface SpinePreviewItem {
  skel: Record<string, string>;
  atlas: Record<string, string>;
  images: Record<string, string>;
}

export class MonoBehaviourLoader extends AssetLoader<MonoBehaviour> {
  get isSprites() {
    return !!this.object.sprites?.length;
  }

  get isSpine() {
    return this.object.isSpine;
  }

  override canExport(): boolean {
    return this.isSprites || this.isSpine;
  }

  override async export(): Promise<AssetExportItem[] | null> {
    if (this.isSprites) {
      const items: AssetExportItem[] = [];
      await Promise.all(
        this.object.sprites!.map(async sprite => {
          const blob = await this.getImageForExport(sprite.guid);
          if (!blob) return;
          items.push({
            name: `${this.objNameForFile}/${getLegalFileName(sprite.name)}.png`,
            blob,
          });
        }),
      );
      return items;
    }

    if (this.isSpine) {
      const items = await this.getSpineForExport();
      if (!items) return null;
      return await Promise.all(
        items.map(async ({ name, data: { blob } }) => ({
          name: `${this.objNameForFile}/${getLegalFileName(name)}`,
          blob,
        })),
      );
    }

    return null;
  }

  override getPreviewDetail(): PreviewDetail {
    if (this.isSprites) {
      return {
        type: PreviewType.ImageList,
        detail: this.object.sprites!.map(sprite => ({
          key: sprite.guid,
          name: sprite.name,
        })),
      };
    }

    if (this.isSpine) {
      return { type: PreviewType.Spine };
    }

    return { type: PreviewType.None };
  }

  override async getPreviewData(subKey?: string) {
    if (this.isSprites && subKey) {
      return await this.getImageForPreview(subKey);
    }

    if (this.isSpine) {
      return await this.getSpineForPreview();
    }
  }

  private getCacheKey(subKey?: string): CacheKey {
    return {
      pathId: this.object.pathId,
      subKey,
    };
  }

  private async getImage(subKey: string): Promise<Uint8Array<ArrayBuffer> | undefined> {
    const obj = this.object.sprites?.find(sprite => sprite.guid === subKey);
    const bitmap = await obj?.getImageBitmap();
    if (!bitmap) return;

    return await imageConverterPool.addTask(bitmap);
  }

  private async getImageForPreview(subKey: string): Promise<string | undefined> {
    const key = this.getCacheKey(subKey);
    const item = blobCache.get(key);
    if (item) return item.url;

    const data = await this.getImage(subKey);
    if (!data) return;

    const blob = new Blob([data], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    blobCache.set(key, { url, blob });

    return url;
  }

  private async getImageForExport(subKey: string): Promise<Blob | undefined> {
    const item = blobCache.get(this.getCacheKey(subKey));
    if (item) return item.blob;

    const data = await this.getImage(subKey);
    if (data) return new Blob([data], { type: 'image/png' });
  }

  private async getSpineItem<T>(fn: (blob: Blob) => T): Promise<SpineItem<T>[] | undefined> {
    const spine = await this.object.getSpine(true);
    if (!spine) return;

    return await Promise.all(
      Object.entries(spine).flatMap(([type, data]) =>
        (Object.entries(data) as [SpineItemType, ArrayBuffer | ImgBitMap][]).map(async ([name, buffer]) => {
          if (type === SpineItemType.Image) {
            buffer = await imageConverterPool.addTask(buffer as ImgBitMap);
          }
          const blob = new Blob([buffer as ArrayBuffer], {
            type: type === SpineItemType.Image ? 'image/png' : 'text/plain',
          });
          return {
            type: type as SpineItemType,
            name,
            data: fn(blob),
          };
        }),
      ),
    );
  }

  private spineItemsBlobItemToString(items: SpineItem<BlobItem>[]): SpineItem<string>[] {
    return items.map(({ type, name, data }) => ({
      type,
      name,
      data: data.url,
    }));
  }

  private async getSpineForPreview(): Promise<SpineItem<string>[] | undefined> {
    const key = this.getCacheKey();
    const cachedSpineItems = spineCache.get(key);
    if (cachedSpineItems) {
      return this.spineItemsBlobItemToString(cachedSpineItems);
    }

    const spineItems = await this.getSpineItem(blob => ({ blob, url: URL.createObjectURL(blob) }));
    if (!spineItems) return;

    spineCache.set(key, spineItems);
    return this.spineItemsBlobItemToString(spineItems);
  }

  private async getSpineForExport(): Promise<SpineItem<BlobItem>[] | undefined> {
    const cachedSpineItems = spineCache.get(this.getCacheKey());
    if (cachedSpineItems) return cachedSpineItems;

    const spineItems = await this.getSpineItem(blob => ({ blob, url: '' }));
    if (spineItems) return spineItems;
  }
}
