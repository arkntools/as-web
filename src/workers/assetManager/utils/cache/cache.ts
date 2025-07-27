export interface BlobItem {
  url: string;
  blob: Blob;
}

export interface CacheKey {
  pathId: bigint;
  subKey?: string;
}

export class CacheMap<T> {
  protected readonly map = new Map<string, T>();

  get(key: CacheKey) {
    return this.map.get(this.getKey(key));
  }

  set(key: CacheKey, item: T) {
    this.map.set(this.getKey(key), item);
  }

  has(key: CacheKey) {
    return this.map.has(this.getKey(key));
  }

  clear() {
    this.beforeClear();
    this.map.clear();
  }

  protected beforeClear() {}

  protected getKey({ pathId, subKey }: CacheKey) {
    return subKey ? `${pathId}-${subKey}` : String(pathId);
  }
}
