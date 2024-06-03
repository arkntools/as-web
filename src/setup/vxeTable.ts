import 'vxe-table/styles/cssvar.scss';
import 'vxe-table/es/vxe-table-menu-module/style.css';
import 'vxe-table/es/vxe-icon/style.css';
import type { Plugin } from 'vue';
import VxeTableKeyboardModule from 'vxe-table/es/vxe-table-keyboard-module';
import VxeTableMenuModule from 'vxe-table/es/vxe-table-menu-module';

export const VxeTableModules: Plugin = app => {
  app.use(VxeTableKeyboardModule);
  app.use(VxeTableMenuModule);
};
