// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  // Your custom configs here
  {
    rules: {
      'semi': ['error', 'always']
    }
  },
  // Test file specific rules
  {
    files: ['test/**/*.ts', 'test/**/*.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in test files for edge case testing
      '@typescript-eslint/no-unused-vars': 'off' // Allow unused vars in test files for comprehensive testing
    }
  }
);
