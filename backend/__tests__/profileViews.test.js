const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const profilesRouter = require('../routes/profiles');
const { auth } = require('../middleware/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/profiles', profilesRouter);

describe('Profile View Limits', () => {
  let freeUser, premiumUser, targetUser, freeUserToken, premiumUserToken;

  beforeEach(async () => {
    // Create free user
    freeUser = await User.create({
      email: 'free@example.com',
      password: 'Test@1234',
      firstName: 'Free',
      lastName: 'User',
      gender: 'male',
      dateOfBirth: new Date('1990-01-01'),
      maritalStatus: 'never_married',
      subscription: {
        plan: 'free',
        status: 'active'
      }
    });

    // Create premium user
    premiumUser = await User.create({
      email: 'premium@example.com',
      password: 'Test@1234',
      firstName: 'Premium',
      lastName: 'User',
      gender: 'male',
      dateOfBirth: new Date('1990-01-01'),
      maritalStatus: 'never_married',
      subscription: {
        plan: 'premium',
        status: 'active'
      }
    });

    // Create target user to view
    targetUser = await User.create({
      email: 'target@example.com',
      password: 'Test@1234',
      firstName: 'Target',
      lastName: 'User',
      gender: 'female',
      dateOfBirth: new Date('1990-01-01'),
      maritalStatus: 'never_married'
    });

    // Generate tokens
    freeUserToken = jwt.sign(
      { userId: freeUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );

    premiumUserToken = jwt.sign(
      { userId: premiumUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );
  });

  describe('Free User View Limits', () => {
    it('should allow free user to view up to 10 profiles per month', async () => {
      // View profile 10 times (should all succeed)
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post(`/api/profiles/${targetUser._id}/view`)
          .set('Authorization', `Bearer ${freeUserToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should block free user after 10 profile views per month', async () => {
      // Add 10 profile views manually
      for (let i = 0; i < 10; i++) {
        freeUser.profileViews.push({
          profileId: targetUser._id,
          viewedAt: new Date()
        });
      }
      await freeUser.save();

      // Try to view 11th profile
      const response = await request(app)
        .post(`/api/profiles/${targetUser._id}/view`)
        .set('Authorization', `Bearer ${freeUserToken}`)
        .expect(403);

      expect(response.body.limitReached).toBe(true);
      expect(response.body.message).toContain('limit');
    });

    it('should not count same profile multiple times in a month', async () => {
      // View same profile multiple times
      await request(app)
        .post(`/api/profiles/${targetUser._id}/view`)
        .set('Authorization', `Bearer ${freeUserToken}`)
        .expect(200);

      await request(app)
        .post(`/api/profiles/${targetUser._id}/view`)
        .set('Authorization', `Bearer ${freeUserToken}`)
        .expect(200);

      // Verify only counted once
      const updatedUser = await User.findById(freeUser._id);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const viewsThisMonth = updatedUser.profileViews.filter(view => {
        const viewDate = new Date(view.viewedAt);
        return viewDate.getMonth() === currentMonth &&
               viewDate.getFullYear() === currentYear;
      });

      expect(viewsThisMonth.length).toBe(1);
    });
  });

  describe('Premium User Unlimited Views', () => {
    it('should allow premium user unlimited profile views', async () => {
      // Attempt many views (more than free limit)
      for (let i = 0; i < 15; i++) {
        const newTarget = await User.create({
          email: `target${i}@example.com`,
          password: 'Test@1234',
          firstName: 'Target',
          lastName: `User${i}`,
          gender: 'female',
          dateOfBirth: new Date('1990-01-01'),
          maritalStatus: 'never_married'
        });

        const response = await request(app)
          .post(`/api/profiles/${newTarget._id}/view`)
          .set('Authorization', `Bearer ${premiumUserToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should not have view limits for premium users', async () => {
      const updatedUser = await User.findById(premiumUser._id);
      const canView = await updatedUser.canViewProfile(targetUser._id);

      expect(canView.allowed).toBe(true);
      expect(canView.requiresPremium).toBeUndefined();
    });
  });

  describe('View Tracking', () => {
    it('should record profile view with correct data', async () => {
      await request(app)
        .post(`/api/profiles/${targetUser._id}/view`)
        .set('Authorization', `Bearer ${freeUserToken}`)
        .expect(200);

      const updatedUser = await User.findById(freeUser._id);
      expect(updatedUser.profileViews.length).toBe(1);
      expect(updatedUser.profileViews[0].profileId.toString()).toBe(targetUser._id.toString());
      expect(updatedUser.profileViews[0].viewedAt).toBeDefined();
    });

    it('should not allow viewing own profile', async () => {
      const response = await request(app)
        .post(`/api/profiles/${freeUser._id}/view`)
        .set('Authorization', `Bearer ${freeUserToken}`)
        .expect(400);

      expect(response.body.message).toContain('own profile');
    });
  });
});
