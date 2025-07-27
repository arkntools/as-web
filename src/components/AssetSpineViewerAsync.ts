export default (c => {
  c.name = 'AssetSpineViewerAsync';
  return c;
})(defineAsyncComponent(() => import('./AssetSpineViewer.vue')));
