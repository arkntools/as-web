import { useToggle } from '@vueuse/core';
import IElMinus from '~icons/ep/minus';
import IElPlus from '~icons/ep/plus';
import IElSelect from '~icons/ep/select';
import IElWarnTriangleFilled from '~icons/ep/warn-triangle-filled';
import type AddRepoSourceDialog from '@/components/AddRepoSourceDialog.vue';
import type { MenuDropdownConfigItem } from '@/components/MenuDropdown.vue';
import { useRepository } from '@/store/repository';
import { useRepoAvailable } from './useRepoAvailable';

const ifSelectIcon = (condition: boolean, otherwise?: Component) => (condition ? IElSelect : otherwise);

export const useRepoMenuItems = ({ dialogRef }: { dialogRef: Ref<InstanceType<typeof AddRepoSourceDialog>> }) => {
  const repoManager = useRepository();
  const { available } = useRepoAvailable();

  const [removeMode, toggleRemoveMode] = useToggle();
  const confirmRemoveName = ref('');

  watch(removeMode, () => {
    if (!removeMode.value) confirmRemoveName.value = '';
  });

  const disabled = computed(() => !available.value);
  const disabledWhenRemoveMode = computed(() => removeMode.value || disabled.value);
  const redWhenRemoveMode = computed(() => (removeMode.value ? 'var(--el-color-danger)' : undefined));

  const preItems: MenuDropdownConfigItem[] = [
    {
      name: 'Install extension script',
      handler: () => {
        window.open('https://greasyfork.org/scripts/548700', '_blank');
      },
      icon: () => ifSelectIcon(available.value, IElWarnTriangleFilled),
      iconColor: () => (available ? 'var(--el-color-success)' : 'var(--el-color-warning)'),
    },
    {
      name: 'Disabled',
      handler: () => repoManager.selectSource(),
      icon: () => ifSelectIcon(!repoManager.selectingSource),
      disabled: disabledWhenRemoveMode,
      divided: true,
    },
  ];

  const postItems: MenuDropdownConfigItem[] = [
    {
      name: 'Add',
      handler: async () => {
        try {
          const source = await dialogRef.value?.open();
          if (source) repoManager.addSource(source);
        } catch {}
      },
      icon: () => IElPlus,
      disabled: disabledWhenRemoveMode,
      divided: true,
    },
    {
      name: 'Remove',
      handler: () => {
        toggleRemoveMode();
      },
      icon: () => IElMinus,
      iconColor: redWhenRemoveMode,
      disabled,
      keepShowOnClick: true,
    },
  ];

  const repoMenuItems = computed(() => [
    ...preItems,
    ...repoManager.sourceList.map(source => ({
      name: () => (confirmRemoveName.value === source.name ? `${source.name} (REALLY?)` : source.name),
      title: source.url,
      handler: () => {
        if (!removeMode.value) {
          repoManager.selectSource(source);
          return;
        }
        if (confirmRemoveName.value === source.name) {
          repoManager.removeSource(source);
          confirmRemoveName.value = '';
          return;
        }
        confirmRemoveName.value = source.name;
      },
      icon: () => (removeMode.value ? IElMinus : ifSelectIcon(repoManager.selectingSource === source.url)),
      iconColor: redWhenRemoveMode,
      disabled,
      keepShowOnClick: removeMode,
    })),
    ...postItems,
  ]);

  return {
    repoMenuItems,
  };
};
