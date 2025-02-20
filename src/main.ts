import './setup/serviceWorker';
import './setup/vxeTableStyle';
import 'splitpanes/dist/splitpanes.css';
import './main.scss';
import { createPinia } from 'pinia';
import App from './App.vue';
import { VxeTableModules } from './setup/vxeTable';

const app = createApp(App);

app.use(createPinia());
app.use(VxeTableModules);

app.mount('#app');
