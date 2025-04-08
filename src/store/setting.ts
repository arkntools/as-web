import { BundleEnv } from '@arkntools/unity-js';
import { useLocalStorage } from '@vueuse/core';
import { pick } from 'lodash-es';
import { defineStore } from 'pinia';
import { ExportGroupMethod } from '@/types/export';

export const useSetting = defineStore('setting', () => {
  const data = useLocalStorage(
    'settings',
    {
      enablePreview: true,
      exportGroupMethod: ExportGroupMethod.NONE,
      unityCNKeyEnabled: false,
      unityCNKey: '',
      unityEnv: BundleEnv.ARKNIGHTS,
    },
    {
      mergeDefaults: (storageValue, defaults) => ({
        ...defaults,
        ...pick(storageValue, Object.keys(defaults) as any as keyof typeof defaults),
      }),
    },
  );

  return {
    data,
    unityCNKey: computed(() => (data.value.unityCNKeyEnabled ? data.value.unityCNKey || undefined : undefined)),
  };
});
