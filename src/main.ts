import 'vxe-table/styles/cssvar.scss';
import 'vxe-table/es/vxe-table-menu-module/style.css';
import 'splitpanes/dist/splitpanes.css';
import './main.scss';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import VxeTableKeyboardModule from 'vxe-table/es/vxe-table-keyboard-module';
import VxeTableMenuModule from 'vxe-table/es/vxe-table-menu-module';
import App from './App.vue';

const app = createApp(App);

app.use(createPinia()).use(VxeTableMenuModule).use(VxeTableKeyboardModule);

app.mount('#app');
