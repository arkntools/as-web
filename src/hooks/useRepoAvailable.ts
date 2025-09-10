import { lib } from '@arkntools/as-web-repo';

export const useRepoAvailable = () => {
  const available = ref(lib.available());

  lib.waitAvailable().then(() => {
    available.value = true;
  });

  return {
    available: readonly(available),
  };
};
