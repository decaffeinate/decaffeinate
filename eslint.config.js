const eslint = require("@eslint/js");
const tseslint = require('typescript-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const jest = require('eslint-plugin-jest');

module.exports = [
  {
    ignores: ['**/*.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  eslintPluginPrettierRecommended,
  {
    files: ['test/**/*.ts'],
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/expect-expect': 'off',
      'jest/no-if': 'off',
      'jest/prefer-expect-assertions': 'off',
    }
  },
  {
    files: ['{script,src}/**/*.ts'],
    rules: {
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/no-parameter-properties': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: false }],
      'no-unused-vars': 'off',
      'prettier/prettier': ['error'],
    },
  }
];
