// eslint-disable-next-line import/order
import { VxeTableModules } from './setup/vxeTable';
import 'splitpanes/dist/splitpanes.css';
import './main.scss';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

app.use(createPinia());
app.use(VxeTableModules);

app.mount('#app');
