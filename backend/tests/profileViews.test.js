const mongoose = require('mongoose');
const User = require('../models/User');

let userCounter = 0;

const createUser = (overrides = {}) => {
  userCounter += 1;

  const baseSubscription = {
    plan: 'free',
    profileViewsThisMonth: 0,
    lastResetDate: new Date()
  };

  const baseData = {
    email: `user${userCounter}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: new Date(1990, 0, 1),
    gender: 'male',
    maritalStatus: 'never_married',
    religiousLevel: 'practicing',
    prayerFrequency: '5_times_daily',
    wali: { hasWali: false },
    location: { country: 'Singapore', city: 'Singapore' },
    subscription: baseSubscription,
    profileViews: []
  };

  const mergedSubscription = {
    ...baseSubscription,
    ...(overrides.subscription || {})
  };

  return new User({
    ...baseData,
    ...overrides,
    subscription: mergedSubscription
  });
};

describe('Profile view limits', () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('free users cannot exceed ten monthly profile views', () => {
    const user = createUser();

    for (let i = 0; i < 10; i += 1) {
      const targetId = new mongoose.Types.ObjectId();
      const check = user.canViewProfile(targetId.toString());
      expect(check.allowed).toBe(true);

      const record = user.recordProfileView(targetId.toString());
      expect(record.isNewView).toBe(true);
    }

    expect(user.subscription.profileViewsThisMonth).toBe(10);

    const extraTarget = new mongoose.Types.ObjectId();
    const finalCheck = user.canViewProfile(extraTarget.toString());
    expect(finalCheck.allowed).toBe(false);
    expect(finalCheck.requiresPremium).toBe(true);
    expect(finalCheck.reason).toMatch('Monthly profile view limit');
  });

  test('premium users can view profiles without limits', () => {
    const user = createUser({
      subscription: {
        plan: 'premium',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });

    for (let i = 0; i < 15; i += 1) {
      const targetId = new mongoose.Types.ObjectId();
      const check = user.canViewProfile(targetId.toString());
      expect(check.allowed).toBe(true);

      const record = user.recordProfileView(targetId.toString());
      expect(record.isNewView).toBe(true);
    }

    const extraCheck = user.canViewProfile(new mongoose.Types.ObjectId().toString());
    expect(extraCheck.allowed).toBe(true);
  });

  test('repeated views in the same month do not increment the counter', () => {
    const user = createUser();
    const targetId = new mongoose.Types.ObjectId().toString();

    const firstRecord = user.recordProfileView(targetId);
    expect(firstRecord.isNewView).toBe(true);
    expect(user.subscription.profileViewsThisMonth).toBe(1);

    const secondRecord = user.recordProfileView(targetId);
    expect(secondRecord.isNewView).toBe(false);
    expect(user.subscription.profileViewsThisMonth).toBe(1);
  });
});
