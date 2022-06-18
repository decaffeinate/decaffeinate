/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/(*_test|test).ts'],
  watchPathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/test_fixtures'],
};
