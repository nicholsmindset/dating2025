const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const User = require('../../models/User');
const subscriptionRouter = require('../subscription');
const jwt = require('jsonwebtoken');

let mongoServer;
let app;

// Mock Stripe and PaymentService
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'test_client_secret',
        amount: 2300,
        currency: 'sgd'
      })
    },
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'cus_test123' })
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
      }),
      del: jest.fn().mockResolvedValue({ id: 'sub_test123', status: 'canceled' })
    }
  }));
});

jest.mock('../../services/paymentService', () => ({
  createOrGetCustomer: jest.fn().mockResolvedValue('cus_test123'),
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test123',
    client_secret: 'test_client_secret',
    amount: 2300,
    currency: 'sgd'
  }),
  createSubscription: jest.fn().mockResolvedValue({
    id: 'sub_test123',
    status: 'active'
  })
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Setup express app for testing
  app = express();
  app.use(express.json());
  app.use('/api/subscription', subscriptionRouter);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  jest.clearAllMocks();
});

// Helper functions
const createTestUser = async (overrides = {}) => {
  const user = await User.create({
    email: overrides.email || 'test@test.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    maritalStatus: 'never_married',
    religiousLevel: 'practicing',
    prayerFrequency: '5_times_daily',
    location: { country: 'USA', city: 'New York' },
    wali: { hasWali: false },
    subscription: overrides.subscription || {
      plan: 'free',
      isPremium: false
    },
    profileViews: overrides.profileViews || [],
    ...overrides
  });

  return user;
};

const generateAuthToken = (userId) => {
  return jwt.sign({ userId, id: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '7d' });
};

describe('Subscription Routes', () => {
  describe('GET /api/subscription/status', () => {
    it('should return subscription status for free user', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .get('/api/subscription/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.isPremium).toBe(false);
      expect(res.body.plan).toBe('free');
      expect(res.body.monthlyViews).toBe(0);
      expect(res.body.viewsRemaining).toBe(10);
    });

    it('should return subscription status for premium user', async () => {
      const user = await createTestUser({
        subscription: {
          plan: 'premium',
          isPremium: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .get('/api/subscription/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.isPremium).toBe(true);
      expect(res.body.plan).toBe('premium');
      expect(res.body.viewsRemaining).toBe('unlimited');
      expect(res.body.features.unlimitedViews).toBe(true);
    });

    it('should calculate remaining views correctly', async () => {
      const currentMonth = new Date();
      const profileViews = [
        { profileId: new mongoose.Types.ObjectId(), viewedAt: new Date() },
        { profileId: new mongoose.Types.ObjectId(), viewedAt: new Date() },
        { profileId: new mongoose.Types.ObjectId(), viewedAt: new Date() }
      ];

      const user = await createTestUser({ profileViews });
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .get('/api/subscription/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.monthlyViews).toBe(3);
      expect(res.body.viewsRemaining).toBe(7);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/subscription/status');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/subscription/plans', () => {
    it('should return available subscription plans', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .get('/api/subscription/plans')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.plans).toBeDefined();
      expect(Array.isArray(res.body.plans)).toBe(true);
      expect(res.body.plans).toHaveLength(2);

      const freePlan = res.body.plans.find(p => p.id === 'free');
      const premiumPlan = res.body.plans.find(p => p.id === 'premium');

      expect(freePlan).toBeDefined();
      expect(freePlan.price).toBe(0);

      expect(premiumPlan).toBeDefined();
      expect(premiumPlan.price).toBe(23);
      expect(premiumPlan.popular).toBe(true);
    });
  });

  describe('POST /api/subscription/create-payment-intent', () => {
    it('should create payment intent for new subscription', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .post('/api/subscription/create-payment-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.clientSecret).toBeDefined();
      expect(res.body.amount).toBe(2300);
      expect(res.body.currency).toBe('sgd');
    });

    it('should prevent creating payment intent for active premium user', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const user = await createTestUser({
        subscription: {
          plan: 'premium',
          isPremium: true,
          startDate: new Date(),
          endDate: futureDate
        }
      });
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .post('/api/subscription/create-payment-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already have an active premium subscription');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const token = generateAuthToken(fakeId);

      const res = await request(app)
        .post('/api/subscription/create-payment-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(404);
    });
  });

  describe('Feature Access', () => {
    it('should show correct features for free users', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .get('/api/subscription/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.features).toEqual({
        unlimitedViews: false,
        unblurredPhotos: false,
        advancedFilters: false,
        prioritySupport: false,
        readReceipts: false
      });
    });

    it('should show correct features for premium users', async () => {
      const user = await createTestUser({
        subscription: {
          plan: 'premium',
          isPremium: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .get('/api/subscription/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.features).toEqual({
        unlimitedViews: true,
        unblurredPhotos: true,
        advancedFilters: true,
        prioritySupport: true,
        readReceipts: true
      });
    });
  });

  describe('Subscription Validation', () => {
    it('should calculate views from current month only', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const profileViews = [
        { profileId: new mongoose.Types.ObjectId(), viewedAt: lastMonth }, // Last month
        { profileId: new mongoose.Types.ObjectId(), viewedAt: new Date() }, // This month
        { profileId: new mongoose.Types.ObjectId(), viewedAt: new Date() }  // This month
      ];

      const user = await createTestUser({ profileViews });
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .get('/api/subscription/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.monthlyViews).toBe(2); // Only current month
      expect(res.body.viewsRemaining).toBe(8);
    });

    it('should handle max views correctly', async () => {
      const profileViews = Array(15).fill(null).map(() => ({
        profileId: new mongoose.Types.ObjectId(),
        viewedAt: new Date()
      }));

      const user = await createTestUser({ profileViews });
      const token = generateAuthToken(user._id);

      const res = await request(app)
        .get('/api/subscription/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.monthlyViews).toBe(15);
      expect(res.body.viewsRemaining).toBe(0);
    });
  });
});
