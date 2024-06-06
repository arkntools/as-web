import { transfer } from 'comlink';
import JSZip from 'jszip';
import type { JSZipGeneratorOptions, OnUpdateCallback } from 'jszip';

export interface JSZipFile {
  name: string;
  data: ArrayBuffer | string;
}

const getOrderedName = (name: string, order: number) => {
  const extIndex = name.lastIndexOf('.');
  return extIndex === -1
    ? `${name} (${order})`
    : `${name.substring(0, extIndex)} (${order})${name.substring(extIndex)}`;
};

export class Zip {
  private readonly zip = new JSZip();
  private readonly nameOrderMap = new Map<string, number>();

  add({ name, data }: JSZipFile) {
    if (this.nameOrderMap.has(name)) {
      const curOrder = this.nameOrderMap.get(name)! + 1;
      this.zip.file(getOrderedName(name, curOrder), data);
      return;
    }
    this.nameOrderMap.set(name, 0);
    this.zip.file(name, data);
  }

  async generate(options?: JSZipGeneratorOptions, onUpdate?: OnUpdateCallback): Promise<ArrayBuffer> {
    const data = await this.zip.generateAsync({ ...options, type: 'arraybuffer' }, onUpdate);
    return transfer(data, [data]);
  }
}
