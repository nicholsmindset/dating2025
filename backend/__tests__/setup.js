const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.test' });

// Setup before all tests
beforeAll(async () => {
  // Connect to test database
  const testDbUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/islamic-dating-test';

  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Clean up after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.close();
});

// Global test timeout
jest.setTimeout(10000);
