import { refDebounced } from '@vueuse/core';

export interface UseRefDebouncedConditionalOptions<T> {
  initValue: T;
  delay: number;
  condition: (value: T) => boolean;
}

export const useRefDebouncedConditional = <T>(options: UseRefDebouncedConditionalOptions<T>) => {
  const source = ref(options.initValue);
  const sourceDebounced = refDebounced(source, options.delay);
  const result = computed(() => (options.condition(source.value) ? sourceDebounced.value : ''));

  return {
    source,
    result,
  };
};
