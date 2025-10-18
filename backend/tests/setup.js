const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/pusherService', () => ({
  pusher: {
    trigger: jest.fn(),
  },
  pusherService: {
    sendNewMessage: jest.fn(),
    sendTypingIndicator: jest.fn(),
    sendProfileView: jest.fn(),
    sendLikeNotification: jest.fn(),
    sendMatchNotification: jest.fn(),
    sendAdminNotification: jest.fn(),
    updateOnlineStatus: jest.fn(),
  },
}));

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_123';
  process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
