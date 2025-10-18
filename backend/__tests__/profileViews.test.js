const mongoose = require('mongoose');
const User = require('../models/User');

describe('Profile view tracking', () => {
  const baseUserData = {
    email: 'viewer@example.com',
    password: 'password123',
    firstName: 'Viewer',
    lastName: 'User',
    dateOfBirth: new Date(1990, 0, 1),
    gender: 'male',
    maritalStatus: 'never_married',
    religiousLevel: 'practicing',
    prayerFrequency: '5_times_daily',
    location: { country: 'SG', city: 'Singapore' },
    wali: { hasWali: false },
    profileViews: [],
    subscription: {
      plan: 'free',
      isPremium: false,
      status: 'active',
      profileViewsThisMonth: 0,
      lastResetDate: new Date()
    }
  };

  test('free users lose a view only when recording a new profile view', () => {
    const viewer = new User(baseUserData);
    const targetId = new mongoose.Types.ObjectId();

    const permission = viewer.canViewProfile(targetId.toString());
    expect(permission.allowed).toBe(true);

    const firstRecord = viewer.recordProfileView(targetId);
    expect(firstRecord.alreadyViewed).toBe(false);
    expect(viewer.subscription.profileViewsThisMonth).toBe(1);

    const secondRecord = viewer.recordProfileView(targetId);
    expect(secondRecord.alreadyViewed).toBe(true);
    expect(viewer.subscription.profileViewsThisMonth).toBe(1);
  });

  test('monthly counter resets when the month changes', () => {
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 2);

    const viewer = new User({
      ...baseUserData,
      subscription: {
        plan: 'free',
        isPremium: false,
        status: 'active',
        profileViewsThisMonth: 10,
        lastResetDate: pastDate
      }
    });

    const resetOccurred = viewer.resetMonthlyViews();
    expect(resetOccurred).toBe(true);
    expect(viewer.subscription.profileViewsThisMonth).toBe(0);

    const resetDate = new Date(viewer.subscription.lastResetDate);
    const now = new Date();
    expect(resetDate.getMonth()).toBe(now.getMonth());
    expect(resetDate.getFullYear()).toBe(now.getFullYear());
  });
});
