const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const {
  calculateMatchScore,
  getMatchSuggestions,
  getMatchReasons,
  isMutualMatch
} = require('../matchingService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('calculateMatchScore', () => {
  it('should return 0 for same gender users', async () => {
    const user1 = {
      _id: new mongoose.Types.ObjectId(),
      gender: 'male',
      age: 30
    };
    const user2 = {
      _id: new mongoose.Types.ObjectId(),
      gender: 'male',
      age: 32
    };

    const score = calculateMatchScore(user1, user2);
    expect(score).toBe(0);
  });

  it('should return 0 for blocked users', async () => {
    const user1Id = new mongoose.Types.ObjectId();
    const user2Id = new mongoose.Types.ObjectId();

    const user1 = {
      _id: user1Id,
      gender: 'male',
      age: 30,
      blockedUsers: [user2Id]
    };
    const user2 = {
      _id: user2Id,
      gender: 'female',
      age: 28
    };

    const score = calculateMatchScore(user1, user2);
    expect(score).toBe(0);
  });

  it('should give high score for perfect match', async () => {
    const user1 = {
      _id: new mongoose.Types.ObjectId(),
      gender: 'male',
      age: 30,
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      education: 'bachelor',
      location: { country: 'Singapore', city: 'Singapore' },
      bio: 'A long bio describing myself in detail with more than 50 characters',
      occupation: 'Engineer',
      profilePhoto: 'photo.jpg',
      partnerPreferences: {
        ageRange: { min: 25, max: 35 },
        maritalStatus: ['divorced', 'widow'],
        religiousLevel: ['practicing'],
        education: ['bachelor', 'master'],
        location: { countries: ['Singapore'] }
      }
    };

    const user2 = {
      _id: new mongoose.Types.ObjectId(),
      gender: 'female',
      age: 28,
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      education: 'bachelor',
      location: { country: 'Singapore', city: 'Singapore' },
      bio: 'A long bio describing myself in detail with more than 50 characters',
      occupation: 'Teacher',
      profileImages: [{ url: 'photo.jpg' }]
    };

    const score = calculateMatchScore(user1, user2);
    expect(score).toBeGreaterThan(80);
  });

  it('should give lower score for mismatched preferences', async () => {
    const user1 = {
      _id: new mongoose.Types.ObjectId(),
      gender: 'male',
      age: 30,
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Singapore', city: 'Singapore' },
      partnerPreferences: {
        ageRange: { min: 25, max: 30 },
        maritalStatus: ['never_married'],
        religiousLevel: ['practicing'],
        location: { countries: ['Malaysia'] }
      }
    };

    const user2 = {
      _id: new mongoose.Types.ObjectId(),
      gender: 'female',
      age: 40, // Outside age range
      maritalStatus: 'divorced', // Not in preferences
      religiousLevel: 'learning', // Not in preferences
      prayerFrequency: 'rarely',
      location: { country: 'Indonesia', city: 'Jakarta' } // Not in preferred countries
    };

    const score = calculateMatchScore(user1, user2);
    expect(score).toBeLessThan(50);
  });

  it('should prioritize religious compatibility', async () => {
    const user1 = {
      _id: new mongoose.Types.ObjectId(),
      gender: 'male',
      age: 30,
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Singapore', city: 'Singapore' },
      partnerPreferences: {
        religiousLevel: ['practicing']
      }
    };

    const user2 = {
      _id: new mongoose.Types.ObjectId(),
      gender: 'female',
      age: 28,
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Indonesia', city: 'Jakarta' }
    };

    const score = calculateMatchScore(user1, user2);
    // Should still have decent score despite different country
    expect(score).toBeGreaterThan(40);
  });
});

describe('getMatchSuggestions', () => {
  let user1, user2, user3, user4;

  beforeEach(async () => {
    // Create test users
    user1 = await User.create({
      email: 'user1@example.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'One',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Singapore', city: 'Singapore' },
      wali: { hasWali: false },
      isVerified: true,
      isActive: true,
      accountStatus: 'active',
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      },
      partnerPreferences: {
        ageRange: { min: 25, max: 35 },
        maritalStatus: ['divorced', 'widow'],
        religiousLevel: ['practicing']
      }
    });

    user2 = await User.create({
      email: 'user2@example.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'Two',
      dateOfBirth: '1992-01-01', // Age 33
      gender: 'female',
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Singapore', city: 'Singapore' },
      wali: { hasWali: false },
      hijabWearing: 'always',
      isVerified: true,
      isActive: true,
      accountStatus: 'active',
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });

    user3 = await User.create({
      email: 'user3@example.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'Three',
      dateOfBirth: '1995-01-01', // Age 30
      gender: 'female',
      maritalStatus: 'widow',
      religiousLevel: 'moderate',
      prayerFrequency: 'regularly',
      location: { country: 'Malaysia', city: 'Kuala Lumpur' },
      wali: { hasWali: false },
      hijabWearing: 'sometimes',
      isVerified: true,
      isActive: true,
      accountStatus: 'active',
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });

    user4 = await User.create({
      email: 'user4@example.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'Four',
      dateOfBirth: '1985-01-01', // Age 40 - outside range
      gender: 'female',
      maritalStatus: 'separated',
      religiousLevel: 'learning',
      prayerFrequency: 'sometimes',
      location: { country: 'Indonesia', city: 'Jakarta' },
      wali: { hasWali: false },
      hijabWearing: 'no',
      isVerified: true,
      isActive: true,
      accountStatus: 'active',
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });
  });

  it('should return match suggestions sorted by score', async () => {
    const matches = await getMatchSuggestions(user1._id, { limit: 10 });

    expect(matches.length).toBeGreaterThan(0);
    // Verify sorted by score
    for (let i = 0; i < matches.length - 1; i++) {
      expect(matches[i].matchScore).toBeGreaterThanOrEqual(matches[i + 1].matchScore);
    }
  });

  it('should not include same gender users', async () => {
    const matches = await getMatchSuggestions(user1._id);

    matches.forEach(match => {
      expect(match.gender).not.toBe(user1.gender);
    });
  });

  it('should not include blocked users', async () => {
    const blockUserId = user2._id;
    await User.findByIdAndUpdate(user1._id, {
      $push: { blockedUsers: blockUserId }
    });

    const matches = await getMatchSuggestions(user1._id);

    const blockedUserInMatches = matches.find(m => m._id.toString() === blockUserId.toString());
    expect(blockedUserInMatches).toBeUndefined();
  });

  it('should filter by minimum score', async () => {
    const matches = await getMatchSuggestions(user1._id, { minScore: 60 });

    matches.forEach(match => {
      expect(match.matchScore).toBeGreaterThanOrEqual(60);
    });
  });

  it('should respect limit parameter', async () => {
    const matches = await getMatchSuggestions(user1._id, { limit: 2 });

    expect(matches.length).toBeLessThanOrEqual(2);
  });

  it('should include match reasons', async () => {
    const matches = await getMatchSuggestions(user1._id);

    if (matches.length > 0) {
      expect(matches[0].matchReasons).toBeDefined();
      expect(Array.isArray(matches[0].matchReasons)).toBe(true);
    }
  });

  it('should only include verified and active users', async () => {
    const matches = await getMatchSuggestions(user1._id);

    matches.forEach(match => {
      expect(match.isVerified).toBe(true);
      expect(match.isActive).toBe(true);
      expect(match.accountStatus).toBe('active');
    });
  });
});

describe('getMatchReasons', () => {
  it('should return reasons for a good match', () => {
    const user1 = {
      gender: 'male',
      age: 30,
      location: { country: 'Singapore', city: 'Singapore' },
      prayerFrequency: '5_times_daily',
      partnerPreferences: {
        ageRange: { min: 25, max: 35 },
        maritalStatus: ['divorced'],
        religiousLevel: ['practicing']
      }
    };

    const user2 = {
      gender: 'female',
      age: 28,
      location: { country: 'Singapore', city: 'Singapore' },
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      education: 'bachelor'
    };

    const reasons = getMatchReasons(user1, user2);

    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.some(r => r.includes('Singapore'))).toBe(true);
    expect(reasons.some(r => r.includes('Practicing'))).toBe(true);
  });

  it('should limit to 4 reasons', () => {
    const user1 = {
      gender: 'male',
      age: 30,
      location: { country: 'Singapore', city: 'Singapore' },
      prayerFrequency: '5_times_daily',
      partnerPreferences: {
        ageRange: { min: 25, max: 35 },
        maritalStatus: ['divorced'],
        religiousLevel: ['practicing']
      }
    };

    const user2 = {
      gender: 'female',
      age: 28,
      location: { country: 'Singapore', city: 'Singapore' },
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      education: 'bachelor'
    };

    const reasons = getMatchReasons(user1, user2);

    expect(reasons.length).toBeLessThanOrEqual(4);
  });
});

describe('isMutualMatch', () => {
  it('should return true when both users liked each other', async () => {
    const user1 = await User.create({
      email: 'user1@example.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'One',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Singapore', city: 'Singapore' },
      wali: { hasWali: false },
      isVerified: true,
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });

    const user2 = await User.create({
      email: 'user2@example.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'Two',
      dateOfBirth: '1992-01-01',
      gender: 'female',
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Singapore', city: 'Singapore' },
      wali: { hasWali: false },
      hijabWearing: 'always',
      isVerified: true,
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });

    // Both users like each other
    await User.findByIdAndUpdate(user1._id, { $push: { likedProfiles: user2._id } });
    await User.findByIdAndUpdate(user2._id, { $push: { likedProfiles: user1._id } });

    const isMutual = await isMutualMatch(user1._id, user2._id);
    expect(isMutual).toBe(true);
  });

  it('should return false when only one user liked the other', async () => {
    const user1 = await User.create({
      email: 'user1@example.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'One',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Singapore', city: 'Singapore' },
      wali: { hasWali: false },
      isVerified: true,
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });

    const user2 = await User.create({
      email: 'user2@example.com',
      password: 'password123',
      firstName: 'User',
      lastName: 'Two',
      dateOfBirth: '1992-01-01',
      gender: 'female',
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Singapore', city: 'Singapore' },
      wali: { hasWali: false },
      hijabWearing: 'always',
      isVerified: true,
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });

    // Only user1 likes user2
    await User.findByIdAndUpdate(user1._id, { $push: { likedProfiles: user2._id } });

    const isMutual = await isMutualMatch(user1._id, user2._id);
    expect(isMutual).toBe(false);
  });
});
