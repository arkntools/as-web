import { createStore, del, get, set } from 'idb-keyval';
import type { UseStore } from 'idb-keyval';

export class IdbKV<T = any> {
  private readonly store: UseStore;

  constructor(dbName: string) {
    this.store = createStore(dbName, 'kv');
  }

  get(key: IDBValidKey) {
    return get<T>(key, this.store);
  }

  set(key: IDBValidKey, value: T) {
    return set(key, value, this.store);
  }

  del(key: IDBValidKey) {
    return del(key, this.store);
  }
}
