import { BundleEnv } from '@arkntools/unity-js';
import { useLocalStorage } from '@vueuse/core';
import { pick } from 'es-toolkit';
import { defineStore } from 'pinia';
import { ExportGroupMethod } from '@/types/export';

export const useSetting = defineStore('setting', () => {
  const data = useLocalStorage(
    'settings',
    {
      enablePreview: true,
      hideNamelessAssets: true,
      exportGroupMethod: ExportGroupMethod.NONE,
      unityCNKeyEnabled: false,
      unityCNKey: '',
      unityEnv: BundleEnv.ARKNIGHTS,
    },
    {
      mergeDefaults: (storageValue, defaults) => ({
        ...defaults,
        ...pick(storageValue, Object.keys(defaults) as any),
      }),
    },
  );

  return {
    data,
    unityCNKey: computed(() => (data.value.unityCNKeyEnabled ? data.value.unityCNKey || undefined : undefined)),
  };
});
