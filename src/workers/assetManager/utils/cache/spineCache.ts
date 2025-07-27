import { CacheMap } from './cache';
import type { BlobItem } from './cache';

export enum SpineItemType {
  Skel = 'skel',
  Atlas = 'atlas',
  Image = 'image',
}

export interface SpineItem<T> {
  type: SpineItemType;
  name: string;
  data: T;
}

export class SpineCache extends CacheMap<SpineItem<BlobItem>[]> {
  protected override beforeClear() {
    this.map.forEach(items => {
      items.forEach(item => {
        URL.revokeObjectURL(item.data.url);
      });
    });
  }
}

export const spineCache = new SpineCache();
