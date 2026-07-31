const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')

const IGNORES = [
  '**/dist/**',
  '**/.next/**',
  '**/.expo/**',
  '**/node_modules/**',
  '**/*.json',
]

const RULES = {
  'no-console': ['warn', { allow: ['warn', 'error'] }],
}

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  { ignores: IGNORES },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: { ...RULES, 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...RULES,
      // The base rule misreports type-only declarations; defer to the TS-aware one.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]
