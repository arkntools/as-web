import { sizeFormatter } from 'human-readable';

export const formatSize = sizeFormatter({
  std: 'JEDEC',
  render: (literal, symbol) => `${literal} ${symbol}B`,
});
