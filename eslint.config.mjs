import antfu from '@antfu/eslint-config';
import { FlatCompat } from '@eslint/eslintrc';
import autoImport from './eslint.config.autoImport.json';

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
      'style/arrow-parens': ['warn', 'as-needed'],
      'style/brace-style': ['warn', '1tbs'],
      'style/indent': 'off',
      'style/operator-linebreak': 'off',
      'antfu/if-newline': 'off',
      'antfu/top-level-function': 'off',
      'no-console': 'off',
      'no-useless-return': 'warn',
      'unused-imports/no-unused-vars': 'warn',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: [],
        },
      ],
      'vue/block-order': ['error', { order: ['template', 'script', 'style[scoped]', 'style:not([scoped])'] }],
      'ts/member-ordering': 'warn',
      'ts/explicit-member-accessibility': ['warn', { accessibility: 'no-public' }],
      'ts/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
          fixStyle: 'separate-type-imports',
        },
      ],
    },
  },
  autoImport,
);
