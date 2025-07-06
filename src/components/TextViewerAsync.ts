export default (c => {
  c.name = 'TextViewerAsync';
  return c;
})(defineAsyncComponent(() => import('./TextViewer.vue')));
