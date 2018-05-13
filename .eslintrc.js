module.exports = {
  parser: 'typescript-eslint-parser',
  parserOptions: {
    sourceType: 'module'
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error']
  }
};
