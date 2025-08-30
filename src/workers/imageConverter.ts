import type { ImgBitMap } from '@arkntools/unity-js';
import { expose, transfer } from 'comlink';
import { Jimp } from '@/lib/jimp-png';

export const toPNG = async ({ data, ...size }: ImgBitMap) => {
  const img = await new Jimp({ data: Buffer.from(data), ...size });
  const { buffer } = await img.getBuffer('image/png');
  const uint8Array = new Uint8Array(buffer as ArrayBuffer);
  return transfer(uint8Array, [uint8Array.buffer]);
};

expose({ toPNG });
