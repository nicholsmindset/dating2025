module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: ['routes/**/*.js', 'middleware/**/*.js', 'models/**/*.js', '!**/node_modules/**'],
  coverageDirectory: 'coverage',
};
