import { registerSW } from 'virtual:pwa-register';
import SWMsgContent from '@/components/SWMsgContent.vue';

const updateSW = registerSW({ onNeedRefresh: showUpdateMessage });

function showUpdateMessage() {
  const handle = ElNotification({
    title: 'New update available!',
    type: 'info',
    message: h(SWMsgContent, {
      onCancel: () => handle.close(),
      onConfirm: () => {
        updateSW();
        handle.close();
      },
    }),
    duration: 0,
    showClose: false,
  });
}
