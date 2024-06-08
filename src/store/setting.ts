import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ExportGroupMethod } from '@/types/export';
import { pick } from '@/utils/common';

export const useSetting = defineStore('setting', () => {
  const data = useLocalStorage(
    'settings',
    {
      enablePreview: true,
      exportGroupMethod: ExportGroupMethod.NONE,
      unityCNKeyEnabled: false,
      unityCNKey: '',
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
