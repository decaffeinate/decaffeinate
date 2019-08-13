module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier', 'prettier/@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    node: true,
    es6: true
  },
  plugins: ['prettier', '@typescript-eslint/eslint-plugin'],
  rules: {
    '@typescript-eslint/array-type': ['error', { default: 'generic' }],
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: false }],
    'no-unused-vars': 'off',
    'prettier/prettier': ['error']
  },
  overrides: [
    {
      files: 'test/**/*.{js,ts}',
      env: {
        mocha: true
      }
    },
    {
      files: '{script,test}/**/*.{js,ts}',
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
