module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react'],
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime'],
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: ['dist', 'dist-electron', 'release', 'node_modules', 'coverage'],
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
};
