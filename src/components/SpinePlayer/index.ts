import { defineAsyncComponentWithName } from '@/utils/asyncComponent';

export const SpinePlayerAsync = defineAsyncComponentWithName('SpinePlayerAsync', () => import('./SpinePlayer.vue'));
