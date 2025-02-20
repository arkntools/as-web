import type { Plugin } from 'vue';
import { setConfig } from 'vxe-table/es/v-x-e-table';
import VxeTableFilterModule from 'vxe-table/es/vxe-table-filter-module';
import VxeTableKeyboardModule from 'vxe-table/es/vxe-table-keyboard-module';
import VxeTableMenuModule from 'vxe-table/es/vxe-table-menu-module';

const i18nTable: Record<string, string | undefined> = {
  'vxe.table.allFilter': 'All',
  'vxe.table.confirmFilter': 'Apply',
  'vxe.table.resetFilter': 'Reset',
  'vxe.loading.text': 'Loading',
};

setConfig({
  i18n: key => i18nTable[key] ?? (import.meta.env.DEV ? key : ''),
});

export const VxeTableModules: Plugin = app => {
  app.use(VxeTableKeyboardModule);
  app.use(VxeTableMenuModule);
  app.use(VxeTableFilterModule);
};
