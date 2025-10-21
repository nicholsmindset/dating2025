const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const Chat = require('../../models/Chat');
const Match = require('../../models/Match');
const {
  getUserActivityStats,
  getPlatformAnalytics,
  getFeatureUsageStats,
  trackUserAction
} = require('../analyticsService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Chat.deleteMany({});
  await Match.deleteMany({});
});

describe('Analytics Service', () => {
  describe('getUserActivityStats', () => {
    it('should return user activity statistics', async () => {
      const user = await User.create({
        email: 'test@test.com',
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
        likedProfiles: [],
        profileViews: [
          { viewedBy: new mongoose.Types.ObjectId(), viewedAt: new Date() }
        ]
      });

      const result = await getUserActivityStats(user._id.toString(), { period: 'week' });

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.period).toBe('week');
      expect(result.stats.profileViews).toBeGreaterThanOrEqual(0);
      expect(result.stats.likesGiven).toBeGreaterThanOrEqual(0);
      expect(result.stats.matches).toBeGreaterThanOrEqual(0);
    });

    it('should return error for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await getUserActivityStats(fakeId.toString(), { period: 'week' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });
  });

  describe('getPlatformAnalytics', () => {
    beforeEach(async () => {
      // Create test users
      await User.create([
        {
          email: 'user1@test.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'One',
          dateOfBirth: new Date('1995-01-01'),
          gender: 'male',
          maritalStatus: 'never_married',
          religiousLevel: 'practicing',
          prayerFrequency: '5_times_daily',
          location: { country: 'USA', city: 'New York' },
          wali: { hasWali: false },
          isActive: true,
          isVerified: true,
          subscription: { plan: 'free' },
          lastSeen: new Date()
        },
        {
          email: 'user2@test.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'Two',
          dateOfBirth: new Date('1992-01-01'),
          gender: 'female',
          maritalStatus: 'divorced',
          religiousLevel: 'moderate',
          prayerFrequency: 'regularly',
          location: { country: 'Canada', city: 'Toronto' },
          wali: { hasWali: false },
          isActive: true,
          isVerified: true,
          subscription: { plan: 'premium' },
          isPhotoVerified: true,
          lastSeen: new Date()
        },
        {
          email: 'user3@test.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'Three',
          dateOfBirth: new Date('1998-01-01'),
          gender: 'female',
          maritalStatus: 'never_married',
          religiousLevel: 'practicing',
          prayerFrequency: '5_times_daily',
          location: { country: 'USA', city: 'Los Angeles' },
          wali: { hasWali: false },
          isActive: true,
          isVerified: false,
          subscription: { plan: 'free' }
        }
      ]);
    });

    it('should return platform analytics', async () => {
      const result = await getPlatformAnalytics({ period: 'month' });

      expect(result.success).toBe(true);
      expect(result.analytics).toBeDefined();
      expect(result.analytics.users).toBeDefined();
      expect(result.analytics.engagement).toBeDefined();
      expect(result.analytics.demographics).toBeDefined();
    });

    it('should count total users correctly', async () => {
      const result = await getPlatformAnalytics({ period: 'month' });

      expect(result.success).toBe(true);
      expect(result.analytics.users.total).toBe(3);
    });

    it('should count verified users correctly', async () => {
      const result = await getPlatformAnalytics({ period: 'month' });

      expect(result.success).toBe(true);
      expect(result.analytics.users.verified).toBe(2);
    });

    it('should count premium users correctly', async () => {
      const result = await getPlatformAnalytics({ period: 'month' });

      expect(result.success).toBe(true);
      expect(result.analytics.users.premium).toBe(1);
    });

    it('should count photo verified users correctly', async () => {
      const result = await getPlatformAnalytics({ period: 'month' });

      expect(result.success).toBe(true);
      expect(result.analytics.users.photoVerified).toBe(1);
    });

    it('should return gender distribution', async () => {
      const result = await getPlatformAnalytics({ period: 'month' });

      expect(result.success).toBe(true);
      expect(result.analytics.demographics.gender).toBeDefined();
      expect(Array.isArray(result.analytics.demographics.gender)).toBe(true);
    });

    it('should return religious level distribution', async () => {
      const result = await getPlatformAnalytics({ period: 'month' });

      expect(result.success).toBe(true);
      expect(result.analytics.demographics.religiousLevel).toBeDefined();
      expect(Array.isArray(result.analytics.demographics.religiousLevel)).toBe(true);
    });

    it('should return top countries', async () => {
      const result = await getPlatformAnalytics({ period: 'month' });

      expect(result.success).toBe(true);
      expect(result.analytics.demographics.topCountries).toBeDefined();
      expect(Array.isArray(result.analytics.demographics.topCountries)).toBe(true);
    });

    it('should count active users correctly', async () => {
      const result = await getPlatformAnalytics({ period: 'month' });

      expect(result.success).toBe(true);
      expect(result.analytics.users.active).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getFeatureUsageStats', () => {
    beforeEach(async () => {
      await User.create([
        {
          email: 'user1@test.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'One',
          dateOfBirth: new Date('1995-01-01'),
          gender: 'male',
          maritalStatus: 'never_married',
          religiousLevel: 'practicing',
          prayerFrequency: '5_times_daily',
          location: { country: 'USA', city: 'New York' },
          wali: { hasWali: true },
          isActive: true,
          profilePhoto: 'photo1.jpg',
          bio: 'This is my bio',
          likedProfiles: [new mongoose.Types.ObjectId()],
          subscription: { plan: 'premium' }
        },
        {
          email: 'user2@test.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'Two',
          dateOfBirth: new Date('1992-01-01'),
          gender: 'female',
          maritalStatus: 'divorced',
          religiousLevel: 'moderate',
          prayerFrequency: 'regularly',
          location: { country: 'Canada', city: 'Toronto' },
          wali: { hasWali: false },
          isActive: true,
          subscription: { plan: 'free' }
        }
      ]);
    });

    it('should return feature usage statistics', async () => {
      const result = await getFeatureUsageStats();

      expect(result.success).toBe(true);
      expect(result.features).toBeDefined();
      expect(result.totalActiveUsers).toBe(2);
    });

    it('should calculate profile photo usage', async () => {
      const result = await getFeatureUsageStats();

      expect(result.success).toBe(true);
      expect(result.features.profilePhotos).toBeDefined();
      expect(result.features.profilePhotos.users).toBe(1);
      expect(parseFloat(result.features.profilePhotos.percentage)).toBe(50.0);
    });

    it('should calculate complete bio usage', async () => {
      const result = await getFeatureUsageStats();

      expect(result.success).toBe(true);
      expect(result.features.completeBio).toBeDefined();
      expect(result.features.completeBio.users).toBe(1);
    });

    it('should calculate premium usage', async () => {
      const result = await getFeatureUsageStats();

      expect(result.success).toBe(true);
      expect(result.features.premium).toBeDefined();
      expect(result.features.premium.users).toBe(1);
      expect(parseFloat(result.features.premium.percentage)).toBe(50.0);
    });

    it('should calculate wali usage', async () => {
      const result = await getFeatureUsageStats();

      expect(result.success).toBe(true);
      expect(result.features.wali).toBeDefined();
      expect(result.features.wali.users).toBe(1);
    });
  });

  describe('trackUserAction', () => {
    it('should track login action', async () => {
      const user = await User.create({
        email: 'test@test.com',
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
        isOnline: false
      });

      const result = await trackUserAction(user._id.toString(), 'login');

      expect(result.success).toBe(true);

      // Verify user is now online
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isOnline).toBe(true);
      expect(updatedUser.lastSeen).toBeDefined();
    });

    it('should handle tracking errors gracefully', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await trackUserAction(fakeId.toString(), 'login');

      // Should not throw error, just log it
      expect(result.success).toBe(true);
    });
  });
});
