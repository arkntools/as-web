import { AssetType } from '@arkntools/unity-js';
import type { AssetObject } from '@arkntools/unity-js';
import { blobCache, spineCache } from '../utils/cache';
import { AudioClipLoader } from './audioClip';
import { AssetLoader } from './default';
import { ImageLoader } from './image';
import { MonoBehaviourLoader } from './monoBehaviour';
import { TextAssetLoader } from './textAsset';

export * from './default';

const loaderMap = {
  [AssetType.TextAsset]: TextAssetLoader,
  [AssetType.Texture2D]: ImageLoader,
  [AssetType.Sprite]: ImageLoader,
  [AssetType.AudioClip]: AudioClipLoader,
  [AssetType.Material]: ImageLoader,
  [AssetType.MonoBehaviour]: MonoBehaviourLoader,
} as any as Record<AssetType, typeof AssetLoader | undefined>;

export const createLoader = (object: AssetObject) => {
  const Loader = loaderMap[object.type];
  if (!Loader) return new AssetLoader(object);
  return new Loader(object);
};

export const clearCache = () => {
  blobCache.clear();
  spineCache.clear();
};
