import antfu from '@antfu/eslint-config';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat();

export default antfu(
  { vue: true },
  {
    rules: {
      'style/semi': 'off',
    },
  },
  ...compat.config({
    extends: ['@vue/eslint-config-prettier'],
  }),
);
