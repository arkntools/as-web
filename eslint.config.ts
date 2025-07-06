import antfu from '@antfu/eslint-config';
import type { Linter } from 'eslint';
import prettierConfig from 'eslint-config-prettier';
import autoImport from './eslint.config.autoImport.json';

export default antfu(
  {
    vue: {
      overrides: {
        'vue/block-order': ['error', { order: ['template', 'script', 'style[scoped]', 'style:not([scoped])'] }],
      },
    },
    typescript: {
      overrides: {
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
    jsonc: false,
    yaml: false,
    markdown: false,
  },
  prettierConfig as Linter.Config,
  {
    languageOptions: {
      globals: autoImport.globals as any as Linter.Globals,
    },
    rules: {
      'antfu/consistent-list-newline': 'off',
      'style/semi': 'off',
      'style/member-delimiter-style': 'off',
      'style/arrow-parens': ['warn', 'as-needed'],
      'style/brace-style': ['warn', '1tbs'],
      'style/indent': 'off',
      'style/operator-linebreak': 'off',
      'style/quote-props': 'off',
      'antfu/if-newline': 'off',
      'antfu/top-level-function': 'off',
      'no-console': 'off',
      'no-cond-assign': 'off',
      'no-useless-return': 'warn',
      'symbol-description': 'off',
      'unused-imports/no-unused-vars': 'warn',
      'perfectionist/sort-imports': [
        'warn',
        {
          ignoreCase: false,
          newlinesBetween: 'never',
          internalPattern: ['^@/.*'],
          groups: [
            ['side-effect-style', 'side-effect'],
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
        },
      ],
    },
  },
);
