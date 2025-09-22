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
    // Allow common Nuxt single-word component/page names
    'vue/multi-word-component-names': ['error', {
      ignores: ['index', 'default', 'error', 'main', 'app']
    }]
  }
});
