const request = require('supertest');
const express = require('express');
const User = require('../models/User');
const authRouter = require('../routes/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test@1234',
        firstName: 'Test',
        lastName: 'User',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        maritalStatus: 'never_married'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject registration with existing email', async () => {
      // Create existing user
      await User.create({
        email: 'existing@example.com',
        password: 'Test@1234',
        firstName: 'Existing',
        lastName: 'User',
        gender: 'male',
        dateOfBirth: new Date('1990-01-01'),
        maritalStatus: 'never_married'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Test@1234',
          firstName: 'Test',
          lastName: 'User',
          gender: 'male',
          dateOfBirth: '1990-01-01',
          maritalStatus: 'never_married'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('exists');
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
          gender: 'male',
          dateOfBirth: '1990-01-01',
          maritalStatus: 'never_married'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const user = new User({
        email: 'login@example.com',
        password: 'Test@1234',
        firstName: 'Login',
        lastName: 'Test',
        gender: 'male',
        dateOfBirth: new Date('1990-01-01'),
        maritalStatus: 'never_married'
      });
      await user.save();
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test@1234'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@1234'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        email: 'reset@example.com',
        password: 'Test@1234',
        firstName: 'Reset',
        lastName: 'Test',
        gender: 'male',
        dateOfBirth: new Date('1990-01-01'),
        maritalStatus: 'never_married'
      });
    });

    it('should generate password reset token', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'reset@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('email');
      expect(response.body.resetToken).toBeUndefined(); // Should not expose token
    });

    it('should not reveal if email exists (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
