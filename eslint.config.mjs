import antfu from '@antfu/eslint-config';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat();

export default antfu(
  { vue: true },
  ...compat.config({
    extends: ['@vue/eslint-config-prettier'],
  }),
  {
    rules: {
      'style/semi': 'off',
      'style/member-delimiter-style': 'off',
      'style/arrow-parens': ['warn', 'as-need'],
      'antfu/if-newline': 'off',
      'no-useless-return': 'warn',
      'unused-imports/no-unused-vars': 'warn',
      'ts/member-ordering': 'warn',
      'ts/explicit-member-accessibility': ['warn', { accessibility: 'no-public' }],
    },
  },
);
