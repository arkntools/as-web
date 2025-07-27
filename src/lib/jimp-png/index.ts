import { createJimp } from '@jimp/core';
import png from '@jimp/wasm-png';

export const Jimp = createJimp({
  formats: [png],
});

// eslint-disable-next-line ts/no-redeclare
export type Jimp = InstanceType<typeof Jimp>;
