import type { Material, Sprite, Texture2D } from '@arkntools/unity-js';
import { imageConverterPool } from '@/workers/utils/imageConverterPool';
import { blobCache } from '../utils/cache';
import type { CacheKey } from '../utils/cache';
import { AssetLoader, PreviewType } from './default';
import type { AssetExportItem, PreviewDetail } from './default';

export class ImageLoader extends AssetLoader<Texture2D | Sprite | Material> {
  private get cacheKey(): CacheKey {
    return {
      pathId: this.object.pathId,
    };
  }

  override canExport(): boolean {
    return true;
  }

  async export(): Promise<AssetExportItem[] | null> {
    const blob = await this.getImageForExport();
    if (!blob) return null;

    return [
      {
        name: `${this.objNameForFile}.png`,
        blob,
      },
    ];
  }

  override getPreviewDetail(): PreviewDetail {
    return { type: PreviewType.Image };
  }

  override getPreviewData() {
    return this.getImageForPreview();
  }

  private async getImage(): Promise<Uint8Array<ArrayBuffer> | undefined> {
    const bitmap = await this.object.getImageBitmap();
    if (!bitmap) return;

    return await imageConverterPool.addTask(bitmap);
  }

  private async getImageForPreview(): Promise<string | undefined> {
    const key = this.cacheKey;
    const item = blobCache.get(key);
    if (item) return item.url;

    const data = await this.getImage();
    if (!data) return;

    const blob = new Blob([data], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    blobCache.set(key, { url, blob });

    return url;
  }

  private async getImageForExport(): Promise<Blob | undefined> {
    const item = blobCache.get(this.cacheKey);
    if (item) return item.blob;

    const data = await this.getImage();
    if (data) return new Blob([data], { type: 'image/png' });
  }
}
