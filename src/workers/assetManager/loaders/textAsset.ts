import type { TextAsset } from '@arkntools/unity-js';
import { AssetLoader, PreviewType } from './default';
import type { AssetExportItem, PreviewDetail } from './default';

export class TextAssetLoader extends AssetLoader<TextAsset> {
  protected static readonly textDecoder = new TextDecoder('utf-8');

  override canExport(): boolean {
    return true;
  }

  override async export(): Promise<AssetExportItem[] | null> {
    return [
      {
        name: `${this.objNameForFile}.txt`,
        blob: new Blob([this.object.data], { type: 'text/plain' }),
      },
    ];
  }

  override getPreviewDetail(): PreviewDetail {
    return { type: PreviewType.Text };
  }

  override async getPreviewData() {
    return TextAssetLoader.textDecoder.decode(this.object.data);
  }
}
