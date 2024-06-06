import './utils/bufferPolyfill';
import type { ImgBitMap } from '@arkntools/unity-js';
import { transfer } from 'comlink';
import Jimp from 'tiny-jimp';

export const toPNG = async ({ data, ...size }: ImgBitMap): Promise<ArrayBuffer> => {
  const { buffer } = await new Jimp({ data: new Uint8Array(data), ...size })
    .deflateStrategy(0)
    .getBufferAsync(Jimp.MIME_PNG);
  return transfer(buffer, [buffer]);
};
