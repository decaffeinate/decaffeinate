module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/(*_test|test).ts'],
};
