// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  // Exclude build artifacts and caches from linting
  ignores: [
    '**/.nuxt/**',
    '**/.output/**',
    '**/node_modules/**',
    '**/coverage/**'
  ],
  rules: {
    semi: ['error', 'always'],
    'padding-line-between-statements': [
      'error',
      // Require a blank line after const, except when followed by another const
      { blankLine: 'always', prev: 'const', next: '*' },
      { blankLine: 'any',    prev: 'const', next: 'const' }
    ],
    // Allow common Nuxt single-word component/page names
    'vue/multi-word-component-names': ['error', {
      ignores: ['index', 'default', 'error', 'main', 'app']
    }]
  }
});
