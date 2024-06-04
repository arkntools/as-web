import 'vxe-table/styles/cssvar.scss';
import 'vxe-table/es/vxe-table-menu-module/style.css';
import 'vxe-table/es/vxe-icon/style.css';
import 'vxe-table/es/filter/style.css';
import type { Plugin } from 'vue';
import VxeTableKeyboardModule from 'vxe-table/es/vxe-table-keyboard-module';
import VxeTableMenuModule from 'vxe-table/es/vxe-table-menu-module';
import VxeTableFilterModule from 'vxe-table/es/vxe-table-filter-module';
import { setConfig } from 'vxe-table/es/v-x-e-table';

const i18nTable: Record<string, string | undefined> = {
  'vxe.table.allFilter': 'All',
  'vxe.table.confirmFilter': 'Apply',
  'vxe.table.resetFilter': 'Reset',
};

setConfig({
  i18n: key => i18nTable[key] || key,
});

export const VxeTableModules: Plugin = app => {
  app.use(VxeTableKeyboardModule);
  app.use(VxeTableMenuModule);
  app.use(VxeTableFilterModule);
};
