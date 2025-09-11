import { registerSW } from 'virtual:pwa-register';
import SWMsgContent from '@/components/SWMsgContent.vue';

const updateSW = registerSW({
  onNeedRefresh: showUpdateMessage,
  onRegistered(r) {
    if (!r) return;
    setInterval(() => r.update(), 3600e3);
    r.addEventListener('updatefound', () => {
      ElNotification.info({
        title: 'New update found!',
        message: 'Downloading...',
        offset: 32,
      });
    });
  },
});

function showUpdateMessage() {
  const handle = ElNotification.primary({
    title: 'New update available!',
    message: h(SWMsgContent, {
      onCancel: () => handle.close(),
      onConfirm: () => {
        updateSW();
        handle.close();
      },
    }),
    offset: 32,
    duration: 0,
    showClose: false,
  });
}
