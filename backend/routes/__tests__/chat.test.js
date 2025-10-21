const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const User = require('../../models/User');
const Chat = require('../../models/Chat');
const chatRouter = require('../chat');
const jwt = require('jsonwebtoken');

let mongoServer;
let app;

// Mock Pusher service
jest.mock('../../services/pusherService', () => ({
  pusherService: {
    sendNewMessage: jest.fn(),
    sendTypingIndicator: jest.fn()
  }
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Setup express app for testing
  app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Chat.deleteMany({});
});

// Helper functions
const createTestUser = async (overrides = {}) => {
  const user = await User.create({
    email: overrides.email || 'test@test.com',
    password: 'password123',
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'User',
    dateOfBirth: new Date('1990-01-01'),
    gender: overrides.gender || 'male',
    maritalStatus: 'never_married',
    religiousLevel: 'practicing',
    prayerFrequency: '5_times_daily',
    location: { country: 'USA', city: 'New York' },
    wali: overrides.wali || { hasWali: false },
    blockedUsers: overrides.blockedUsers || [],
    accountStatus: 'active',
    ...overrides
  });

  return user;
};

const generateAuthToken = (userId) => {
  return jwt.sign({ userId, id: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '7d' });
};

describe('Chat Routes', () => {
  describe('POST /api/chat/start', () => {
    it('should create a new chat between two users', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });
      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post('/api/chat/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ recipientId: user2._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.chatId).toBeDefined();
      expect(res.body.existing).toBe(false);
    });

    it('should return existing chat if one exists', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      // Create existing chat
      const existingChat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active'
      });

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post('/api/chat/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ recipientId: user2._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.chatId).toBe(existingChat._id.toString());
      expect(res.body.existing).toBe(true);
    });

    it('should not allow starting chat with self', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .post('/api/chat/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ recipientId: user._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot start chat with yourself');
    });

    it('should not allow chat with blocked users', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({
        email: 'user2@test.com',
        gender: 'female',
        blockedUsers: [user1._id]
      });
      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post('/api/chat/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ recipientId: user2._id.toString() });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Cannot start chat');
    });

    it('should return 404 for non-existent recipient', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post('/api/chat/start')
        .set('Authorization', `Bearer ${token}`)
        .send({ recipientId: fakeId.toString() });

      expect(res.status).toBe(404);
    });

    it('should require recipientId', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .post('/api/chat/start')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Recipient ID is required');
    });
  });

  describe('GET /api/chat', () => {
    it('should return all chats for current user', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });
      const user3 = await createTestUser({ email: 'user3@test.com', gender: 'female' });

      // Create chats
      await Chat.create([
        { participants: [user1._id, user2._id], messages: [], status: 'active' },
        { participants: [user1._id, user3._id], messages: [], status: 'active' }
      ]);

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .get('/api/chat')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    it('should not return deleted chats', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      // Create deleted chat
      await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'deleted'
      });

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .get('/api/chat')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/chat/:chatId', () => {
    it('should return specific chat', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active',
        waliSupervision: { required: false }
      });

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .get(`/api/chat/${chat._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(chat._id.toString());
    });

    it('should return 404 for non-participant', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });
      const user3 = await createTestUser({ email: 'user3@test.com', gender: 'female' });

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active'
      });

      const token = generateAuthToken(user3._id);

      const res = await request(app)
        .get(`/api/chat/${chat._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/chat/:chatId/messages', () => {
    it('should send a message in a chat', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active',
        waliSupervision: { required: false }
      });

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post(`/api/chat/${chat._id}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hello there!', type: 'text' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Hello there!');

      // Verify message was saved
      const updatedChat = await Chat.findById(chat._id);
      expect(updatedChat.messages).toHaveLength(1);
    });

    it('should reject empty messages', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active'
      });

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post(`/api/chat/${chat._id}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Message content is required');
    });

    it('should reject messages longer than 1000 characters', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active'
      });

      const token = generateAuthToken(user1._id);
      const longMessage = 'a'.repeat(1001);

      const res = await request(app)
        .post(`/api/chat/${chat._id}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: longMessage });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('too long');
    });
  });

  describe('POST /api/chat/:chatId/report', () => {
    it('should report a chat', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active',
        reports: []
      });

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post(`/api/chat/${chat._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'inappropriate_content',
          description: 'Inappropriate messages'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reported successfully');

      // Verify report was saved
      const updatedChat = await Chat.findById(chat._id);
      expect(updatedChat.reports).toHaveLength(1);
      expect(updatedChat.reports[0].reason).toBe('inappropriate_content');
    });

    it('should require reason for reporting', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active'
      });

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post(`/api/chat/${chat._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('reason is required');
    });
  });

  describe('DELETE /api/chat/:chatId', () => {
    it('should soft delete a chat for one user', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active',
        deletedFor: []
      });

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .delete(`/api/chat/${chat._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');

      // Verify soft delete
      const updatedChat = await Chat.findById(chat._id);
      expect(updatedChat.deletedFor).toContainEqual(user1._id);
      expect(updatedChat.status).toBe('active'); // Still active for other user
    });

    it('should hard delete chat when both users delete', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active',
        deletedFor: [user1._id] // User1 already deleted
      });

      const token = generateAuthToken(user2._id);

      const res = await request(app)
        .delete(`/api/chat/${chat._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify hard delete
      const updatedChat = await Chat.findById(chat._id);
      expect(updatedChat.status).toBe('deleted');
    });
  });

  describe('POST /api/chat/:chatId/typing', () => {
    it('should send typing indicator', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        messages: [],
        status: 'active'
      });

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post(`/api/chat/${chat._id}/typing`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isTyping: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
