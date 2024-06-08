import { defineStore } from 'pinia';

export interface ProgressData {
  value: number;
  type: string;
  desc: string;
  indeterminate: boolean;
}

export const useProgress = defineStore('progress', () => {
  const state: ProgressData = reactive({
    value: 0,
    type: '',
    desc: '',
    indeterminate: false,
  });

  const setProgress = (data: Partial<ProgressData>) => {
    Object.assign(state, data);
  };

  const clearProgress = () => {
    Object.assign(state, {
      value: 0,
      type: '',
      desc: '',
    });
  };

  return {
    ...toRefs(state),
    setProgress,
    clearProgress,
  };
});
