import type { AudioClip, AudioClipGetResult } from '@arkntools/unity-js';
import { blobCache } from '../utils/cache';
import type { CacheKey } from '../utils/cache';
import { AssetLoader, PreviewType } from './default';
import type { AssetExportItem, PreviewDetail } from './default';

const mimeMap: Record<string, string | undefined> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
};

export class AudioClipLoader extends AssetLoader<AudioClip> {
  static fsbToMp3: (params: AudioClipGetResult) => Promise<Uint8Array<ArrayBuffer>>;

  private get cacheKey(): CacheKey {
    return {
      pathId: this.object.pathId,
    };
  }

  override canExport(): boolean {
    return true;
  }

  override async export(): Promise<AssetExportItem[] | null> {
    let blob = blobCache.get(this.cacheKey)?.blob;
    if (!blob) {
      blob = await this.getAudioBlob();
      if (!blob) return null;
    }

    const ext = this.object.format === 'fsb' ? 'mp3' : this.object.format;

    return [
      {
        name: `${this.objNameForFile}.${ext}`,
        blob,
      },
    ];
  }

  override getPreviewDetail(): PreviewDetail {
    return { type: PreviewType.Audio };
  }

  override async getPreviewData() {
    const key = this.cacheKey;
    const cachedUrl = blobCache.get(key)?.url;
    if (cachedUrl) return cachedUrl;

    const blob = await this.getAudioBlob();
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    blobCache.set(key, { blob, url });
    return url;
  }

  private async getAudioBlob() {
    const audio = this.object.getAudio();

    try {
      return new Blob([audio.format === 'fsb' ? await AudioClipLoader.fsbToMp3(audio) : audio.data], {
        type: audio.format === 'fsb' ? mimeMap.mp3 : (mimeMap[audio.format] ?? `audio/${audio.format}`),
      });
    } catch (error) {
      console.error(error);
    }
  }
}
