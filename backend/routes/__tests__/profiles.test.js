const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const User = require('../../models/User');
const profilesRouter = require('../profiles');
const { auth } = require('../../middleware/auth');
const jwt = require('jsonwebtoken');

let mongoServer;
let app;

// Mock Pusher service
jest.mock('../../services/pusherService', () => ({
  pusherService: {
    sendProfileView: jest.fn(),
    sendLikeNotification: jest.fn(),
    sendMatchNotification: jest.fn()
  }
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Setup express app for testing
  app = express();
  app.use(express.json());
  app.use('/api/profiles', profilesRouter);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

// Helper function to create a test user
const createTestUser = async (overrides = {}) => {
  const user = await User.create({
    email: overrides.email || 'test@test.com',
    password: 'password123',
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'User',
    dateOfBirth: overrides.dateOfBirth || new Date('1990-01-01'),
    gender: overrides.gender || 'male',
    maritalStatus: overrides.maritalStatus || 'never_married',
    religiousLevel: overrides.religiousLevel || 'practicing',
    prayerFrequency: overrides.prayerFrequency || '5_times_daily',
    location: overrides.location || { country: 'USA', city: 'New York' },
    wali: overrides.wali || { hasWali: false },
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    accountStatus: overrides.accountStatus || 'active',
    subscription: overrides.subscription || { plan: 'free' },
    ...overrides
  });

  return user;
};

// Helper function to generate auth token
const generateAuthToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '7d' });
};

describe('Profile Routes', () => {
  describe('GET /api/profiles/me', () => {
    it('should return current user profile', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(user.email);
      expect(res.body.firstName).toBe(user.firstName);
      expect(res.body.password).toBeUndefined();
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/profiles/me');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/profiles/me', () => {
    it('should update user profile', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const updates = {
        bio: 'Updated bio',
        occupation: 'Engineer',
        height: 180
      };

      const res = await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Profile updated successfully');
      expect(res.body.user.bio).toBe(updates.bio);
      expect(res.body.user.occupation).toBe(updates.occupation);
      expect(res.body.user.height).toBe(updates.height);
    });

    it('should not update protected fields', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const updates = {
        email: 'newemail@test.com', // Protected field
        password: 'newpassword', // Protected field
        bio: 'Updated bio'
      };

      const res = await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.user.bio).toBe(updates.bio);

      // Verify email and password weren't changed
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.email).toBe(user.email);
    });
  });

  describe('POST /api/profiles/:userId/like', () => {
    it('should like a profile', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });
      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post(`/api/profiles/${user2._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.match).toBe(false);

      // Verify like was recorded
      const updatedUser = await User.findById(user1._id);
      expect(updatedUser.likedProfiles).toContainEqual(user2._id);
    });

    it('should create a match when both users like each other', async () => {
      const user1 = await createTestUser({
        email: 'user1@test.com',
        gender: 'male'
      });
      const user2 = await createTestUser({
        email: 'user2@test.com',
        gender: 'female',
        likedProfiles: [user1._id] // user2 already liked user1
      });
      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post(`/api/profiles/${user2._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.match).toBe(true);
      expect(res.body.message).toContain('match');
    });

    it('should not allow liking yourself', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .post(`/api/profiles/${user._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot like yourself');
    });

    it('should not allow liking the same profile twice', async () => {
      const user1 = await createTestUser({
        email: 'user1@test.com',
        likedProfiles: []
      });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });
      const token = generateAuthToken(user1._id);

      // First like
      await request(app)
        .post(`/api/profiles/${user2._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      // Second like (should fail)
      const res = await request(app)
        .post(`/api/profiles/${user2._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already liked');
    });
  });

  describe('GET /api/profiles/:userId', () => {
    it('should return user profile by ID', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });
      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .get(`/api/profiles/${user2._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe(user2.firstName);
      expect(res.body.email).toBeUndefined(); // Email should be hidden
      expect(res.body.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/profiles/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should block access to blocked user profiles', async () => {
      const user1 = await createTestUser({
        email: 'user1@test.com',
        blockedUsers: []
      });
      const user2 = await createTestUser({
        email: 'user2@test.com',
        gender: 'female'
      });

      // Block user2
      user1.blockedUsers.push(user2._id);
      await user1.save();

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .get(`/api/profiles/${user2._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not accessible');
    });
  });

  describe('POST /api/profiles/:userId/block', () => {
    it('should block a user', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });
      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post(`/api/profiles/${user2._id}/block`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('blocked successfully');

      // Verify block was recorded
      const updatedUser = await User.findById(user1._id);
      expect(updatedUser.blockedUsers).toContainEqual(user2._id);
    });

    it('should not allow blocking yourself', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .post(`/api/profiles/${user._id}/block`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot block yourself');
    });
  });

  describe('DELETE /api/profiles/:userId/block', () => {
    it('should unblock a user', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });

      // Block user2 first
      user1.blockedUsers.push(user2._id);
      await user1.save();

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .delete(`/api/profiles/${user2._id}/block`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('unblocked successfully');

      // Verify unblock
      const updatedUser = await User.findById(user1._id);
      expect(updatedUser.blockedUsers).not.toContainEqual(user2._id);
    });
  });

  describe('POST /api/profiles/:userId/report', () => {
    it('should report a user', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });
      const token = generateAuthToken(user1._id);

      const reportData = {
        reason: 'inappropriate_content',
        description: 'Inappropriate profile picture'
      };

      const res = await request(app)
        .post(`/api/profiles/${user2._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send(reportData);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reported successfully');

      // Verify report was recorded
      const reportedUser = await User.findById(user2._id);
      expect(reportedUser.reports).toHaveLength(1);
      expect(reportedUser.reports[0].reason).toBe(reportData.reason);
      expect(reportedUser.reports[0].description).toBe(reportData.description);
    });

    it('should require a reason for reporting', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });
      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .post(`/api/profiles/${user2._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('reason is required');
    });

    it('should not allow reporting yourself', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .post(`/api/profiles/${user._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'test', description: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot report yourself');
    });
  });

  describe('GET /api/profiles/blocked/list', () => {
    it('should return list of blocked users', async () => {
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com', gender: 'female' });
      const user3 = await createTestUser({ email: 'user3@test.com', gender: 'female' });

      // Block user2 and user3
      user1.blockedUsers = [user2._id, user3._id];
      await user1.save();

      const token = generateAuthToken(user1._id);

      const res = await request(app)
        .get('/api/profiles/blocked/list')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.blockedUsers).toHaveLength(2);
    });
  });
});
