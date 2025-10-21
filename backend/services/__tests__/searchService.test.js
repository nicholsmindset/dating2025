const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const { searchUsers, getSuggestedFilters, calculateDistance } = require('../searchService');

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
});

describe('Search Service', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // New York to Los Angeles (approx 3944 km)
      const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });
  });

  describe('searchUsers', () => {
    let currentUser;
    let testUsers;

    beforeEach(async () => {
      // Create current user
      currentUser = await User.create({
        email: 'current@test.com',
        password: 'password123',
        firstName: 'Current',
        lastName: 'User',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        maritalStatus: 'never_married',
        religiousLevel: 'practicing',
        prayerFrequency: '5_times_daily',
        location: {
          country: 'USA',
          city: 'New York',
          latitude: 40.7128,
          longitude: -74.0060
        },
        wali: {
          hasWali: false
        },
        isActive: true,
        isVerified: true,
        accountStatus: 'active'
      });

      // Create test users
      testUsers = await User.create([
        {
          email: 'user1@test.com',
          password: 'password123',
          firstName: 'Alice',
          lastName: 'Smith',
          dateOfBirth: new Date('1995-05-15'),
          gender: 'female',
          maritalStatus: 'never_married',
          religiousLevel: 'practicing',
          prayerFrequency: '5_times_daily',
          education: 'bachelor',
          occupation: 'Engineer',
          location: {
            country: 'USA',
            city: 'Boston',
            latitude: 42.3601,
            longitude: -71.0589
          },
          wali: {
            hasWali: false
          },
          isActive: true,
          isVerified: true,
          accountStatus: 'active',
          profilePhoto: 'photo1.jpg',
          isPhotoVerified: true,
          subscription: {
            plan: 'premium'
          }
        },
        {
          email: 'user2@test.com',
          password: 'password123',
          firstName: 'Sarah',
          lastName: 'Johnson',
          dateOfBirth: new Date('1992-08-20'),
          gender: 'female',
          maritalStatus: 'divorced',
          religiousLevel: 'moderate',
          prayerFrequency: 'regularly',
          education: 'master',
          occupation: 'Teacher',
          location: {
            country: 'USA',
            city: 'Philadelphia',
            latitude: 39.9526,
            longitude: -75.1652
          },
          wali: {
            hasWali: false
          },
          isActive: true,
          isVerified: true,
          accountStatus: 'active'
        },
        {
          email: 'user3@test.com',
          password: 'password123',
          firstName: 'Fatima',
          lastName: 'Ahmed',
          dateOfBirth: new Date('1998-12-10'),
          gender: 'female',
          maritalStatus: 'never_married',
          religiousLevel: 'practicing',
          prayerFrequency: '5_times_daily',
          education: 'bachelor',
          location: {
            country: 'Canada',
            city: 'Toronto',
            latitude: 43.6532,
            longitude: -79.3832
          },
          wali: {
            hasWali: false
          },
          isActive: true,
          isVerified: false,
          accountStatus: 'active'
        },
        {
          email: 'inactive@test.com',
          password: 'password123',
          firstName: 'Inactive',
          lastName: 'User',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'female',
          maritalStatus: 'never_married',
          religiousLevel: 'practicing',
          prayerFrequency: '5_times_daily',
          location: {
            country: 'USA',
            city: 'New York'
          },
          wali: {
            hasWali: false
          },
          isActive: false,
          accountStatus: 'inactive'
        }
      ]);
    });

    it('should search users with basic filters', async () => {
      const filters = {
        gender: 'female',
        ageMin: 20,
        ageMax: 35
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.length).toBeGreaterThan(0);
      expect(result.users.every(u => u.gender === 'female')).toBe(true);
      expect(result.users.every(u => u.isActive === true)).toBe(true);
    });

    it('should filter by marital status', async () => {
      const filters = {
        gender: 'female',
        maritalStatus: ['divorced']
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.length).toBe(1);
      expect(result.users[0].maritalStatus).toBe('divorced');
    });

    it('should filter by religious level', async () => {
      const filters = {
        gender: 'female',
        religiousLevel: ['practicing']
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.every(u => u.religiousLevel === 'practicing')).toBe(true);
    });

    it('should filter by country', async () => {
      const filters = {
        gender: 'female',
        country: 'Canada'
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.length).toBe(1);
      expect(result.users[0].location.country).toBe('Canada');
    });

    it('should filter by education', async () => {
      const filters = {
        gender: 'female',
        education: ['master']
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.length).toBe(1);
      expect(result.users[0].education).toBe('master');
    });

    it('should filter photo verified users only', async () => {
      const filters = {
        gender: 'female',
        photoVerifiedOnly: true
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.every(u => u.isPhotoVerified === true)).toBe(true);
    });

    it('should filter premium users only', async () => {
      const filters = {
        gender: 'female',
        premiumOnly: true
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.every(u => u.subscription.plan === 'premium')).toBe(true);
    });

    it('should filter verified users only', async () => {
      const filters = {
        gender: 'female',
        verifiedOnly: true
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.every(u => u.isVerified === true)).toBe(true);
    });

    it('should exclude current user from results', async () => {
      const filters = {
        gender: 'male'
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.find(u => u._id.toString() === currentUser._id.toString())).toBeUndefined();
    });

    it('should exclude inactive users', async () => {
      const filters = {
        gender: 'female'
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.every(u => u.isActive === true)).toBe(true);
    });

    it('should exclude blocked users', async () => {
      // Block user1
      currentUser.blockedUsers = [testUsers[0]._id];
      await currentUser.save();

      const filters = {
        gender: 'female'
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.users.find(u => u._id.toString() === testUsers[0]._id.toString())).toBeUndefined();
    });

    it('should support pagination', async () => {
      const filters = {
        gender: 'female'
      };

      const result = await searchUsers(filters, currentUser._id.toString(), {
        page: 1,
        limit: 2
      });

      expect(result.success).toBe(true);
      expect(result.users.length).toBeLessThanOrEqual(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.resultsPerPage).toBe(2);
    });

    it('should sort by creation date', async () => {
      const filters = {
        gender: 'female'
      };

      const result = await searchUsers(filters, currentUser._id.toString(), {
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      expect(result.success).toBe(true);
      // Verify results are sorted (newest first)
      for (let i = 0; i < result.users.length - 1; i++) {
        const currentDate = new Date(result.users[i].createdAt);
        const nextDate = new Date(result.users[i + 1].createdAt);
        expect(currentDate >= nextDate).toBe(true);
      }
    });

    it('should filter by distance', async () => {
      const filters = {
        gender: 'female',
        maxDistance: 200, // km
        userLatitude: 40.7128,
        userLongitude: -74.0060
      };

      const result = await searchUsers(filters, currentUser._id.toString());

      expect(result.success).toBe(true);
      // Should only include users within 200km of New York
      result.users.forEach(user => {
        if (user.distance) {
          expect(user.distance).toBeLessThanOrEqual(200);
        }
      });
    });
  });

  describe('getSuggestedFilters', () => {
    it('should return suggested filters based on user preferences', async () => {
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
        location: {
          country: 'USA',
          city: 'New York'
        },
        wali: {
          hasWali: false
        },
        partnerPreferences: {
          ageRange: {
            min: 25,
            max: 35
          },
          maritalStatus: ['never_married', 'divorced'],
          religiousLevel: ['practicing', 'moderate'],
          location: {
            countries: ['USA', 'Canada'],
            maxDistance: 100
          },
          education: ['bachelor', 'master']
        }
      });

      const result = await getSuggestedFilters(user._id.toString());

      expect(result.success).toBe(true);
      expect(result.filters.gender).toBe('female');
      expect(result.filters.ageMin).toBe(25);
      expect(result.filters.ageMax).toBe(35);
      expect(result.filters.maritalStatus).toEqual(['never_married', 'divorced']);
      expect(result.filters.religiousLevel).toEqual(['practicing', 'moderate']);
      expect(result.filters.country).toBe('USA');
      expect(result.filters.maxDistance).toBe(100);
      expect(result.filters.education).toEqual(['bachelor', 'master']);
    });

    it('should return opposite gender', async () => {
      const femaleUser = await User.create({
        email: 'female@test.com',
        password: 'password123',
        firstName: 'Female',
        lastName: 'User',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'female',
        maritalStatus: 'never_married',
        religiousLevel: 'practicing',
        prayerFrequency: '5_times_daily',
        location: {
          country: 'USA',
          city: 'New York'
        },
        wali: {
          hasWali: false
        }
      });

      const result = await getSuggestedFilters(femaleUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.filters.gender).toBe('male');
    });

    it('should return empty filters for user without preferences', async () => {
      const user = await User.create({
        email: 'nopref@test.com',
        password: 'password123',
        firstName: 'No',
        lastName: 'Pref',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        maritalStatus: 'never_married',
        religiousLevel: 'practicing',
        prayerFrequency: '5_times_daily',
        location: {
          country: 'USA',
          city: 'New York'
        },
        wali: {
          hasWali: false
        }
      });

      const result = await getSuggestedFilters(user._id.toString());

      expect(result.success).toBe(true);
      expect(result.filters.gender).toBe('female');
      // Other filters should not be set
      expect(result.filters.ageMin).toBeUndefined();
      expect(result.filters.maritalStatus).toBeUndefined();
    });
  });
});
