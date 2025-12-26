module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.ts'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testTimeout: 30000,
  verbose: true,
};
