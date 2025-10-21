module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'routes/**/*.js',
    'models/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],

  // Coverage thresholds
  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true
};
