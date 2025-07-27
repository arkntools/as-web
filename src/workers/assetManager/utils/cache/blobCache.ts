import { CacheMap } from './cache';
import type { BlobItem } from './cache';

export class BlobCache extends CacheMap<BlobItem> {
  protected override beforeClear() {
    this.map.forEach(({ url }) => URL.revokeObjectURL(url));
  }
}

export const blobCache = new BlobCache();
