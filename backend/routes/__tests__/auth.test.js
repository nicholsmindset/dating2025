const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');
const authRoutes = require('../auth');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock email service
jest.mock('../../services/emailService', () => ({
  generateVerificationToken: jest.fn(() => 'mock-verification-token'),
  sendVerificationEmail: jest.fn(() => Promise.resolve({ success: true })),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve({ success: true })),
  sendWelcomeEmail: jest.fn(() => Promise.resolve({ success: true })),
  sendWaliNotificationEmail: jest.fn(() => Promise.resolve({ success: true }))
}));

let mongoServer;
let app;

beforeAll(async () => {
  // Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Setup Express app
  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  jest.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  const validUserData = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    maritalStatus: 'divorced',
    religiousLevel: 'practicing',
    prayerFrequency: '5_times_daily',
    location: {
      country: 'Singapore',
      city: 'Singapore'
    },
    wali: {
      hasWali: true,
      waliName: 'Wali Name',
      waliRelation: 'father',
      waliContact: '+65 1234 5678',
      waliEmail: 'wali@example.com'
    }
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUserData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.requiresVerification).toBe(true);
    expect(res.body.user.email).toBe(validUserData.email);
    expect(res.body.user.password).toBeUndefined(); // Password should not be returned
  });

  it('should reject registration with existing email', async () => {
    // Create user first
    await request(app)
      .post('/api/auth/register')
      .send(validUserData);

    // Try to register again with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUserData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('should reject registration with invalid email', async () => {
    const invalidData = { ...validUserData, email: 'invalid-email' };

    const res = await request(app)
      .post('/api/auth/register')
      .send(invalidData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject registration for users under 18', async () => {
    const underageData = {
      ...validUserData,
      dateOfBirth: new Date().toISOString().split('T')[0] // Today's date
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(underageData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('18 years old');
  });

  it('should require hijab preference for female users', async () => {
    const femaleData = {
      ...validUserData,
      gender: 'female'
      // Missing hijabWearing
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(femaleData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Hijab');
  });

  it('should require wali details when hasWali is true', async () => {
    const noWaliDetailsData = {
      ...validUserData,
      wali: {
        hasWali: true
        // Missing wali details
      }
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(noWaliDetailsData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should send verification email after registration', async () => {
    const emailService = require('../../services/emailService');

    await request(app)
      .post('/api/auth/register')
      .send(validUserData);

    expect(emailService.sendVerificationEmail).toHaveBeenCalled();
  });

  it('should send wali notification when wali is present', async () => {
    const emailService = require('../../services/emailService');

    await request(app)
      .post('/api/auth/register')
      .send(validUserData);

    expect(emailService.sendWaliNotificationEmail).toHaveBeenCalled();
  });
});

describe('POST /api/auth/verify-email', () => {
  it('should verify email with valid token', async () => {
    // Create unverified user
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Singapore', city: 'Singapore' },
      wali: { hasWali: false },
      verificationToken: 'test-token',
      isVerified: false,
      accountStatus: 'pending',
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: 'test-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.isVerified).toBe(true);
  });

  it('should reject verification with invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: 'invalid-token' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Create verified user
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
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
    await user.save();
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login for unverified users', async () => {
    // Create unverified user
    const user = new User({
      email: 'unverified@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      maritalStatus: 'widow',
      religiousLevel: 'moderate',
      prayerFrequency: 'regularly',
      hijabWearing: 'always',
      location: { country: 'Singapore', city: 'Singapore' },
      wali: { hasWali: false },
      isVerified: false,
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unverified@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.requiresVerification).toBe(true);
  });

  it('should reject login for inactive accounts', async () => {
    await User.findOneAndUpdate(
      { email: 'test@example.com' },
      { isActive: false }
    );

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('deactivated');
  });
});

describe('POST /api/auth/resend-verification', () => {
  it('should resend verification email for unverified user', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      maritalStatus: 'divorced',
      religiousLevel: 'practicing',
      prayerFrequency: '5_times_daily',
      location: { country: 'Singapore', city: 'Singapore' },
      wali: { hasWali: false },
      isVerified: false,
      subscription: {
        plan: 'free',
        profileViewsThisMonth: 0,
        lastResetDate: new Date()
      }
    });
    await user.save();

    const emailService = require('../../services/emailService');

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(emailService.sendVerificationEmail).toHaveBeenCalled();
  });

  it('should reject resend for already verified user', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
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
    await user.save();

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already verified');
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('should send password reset email', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
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
    await user.save();

    const emailService = require('../../services/emailService');

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it('should not reveal if email exists (security)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });

    // Should return success even if email doesn't exist (security best practice)
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('should reset password with valid token', async () => {
    const jwt = require('jsonwebtoken');

    const user = new User({
      email: 'test@example.com',
      password: 'oldpassword',
      firstName: 'John',
      lastName: 'Doe',
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
    await user.save();

    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 3600000);
    await user.save();

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetToken,
        password: 'newpassword123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify password was changed
    const updatedUser = await User.findById(user._id).select('+password');
    const isValid = await updatedUser.comparePassword('newpassword123');
    expect(isValid).toBe(true);
  });

  it('should reject reset with invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: 'invalid-token',
        password: 'newpassword123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
