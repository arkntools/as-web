import { defineAsyncComponentWithName } from '@/utils/asyncComponent';

export const TextViewerAsync = defineAsyncComponentWithName('TextViewerAsync', () => import('./TextViewer.vue'));
