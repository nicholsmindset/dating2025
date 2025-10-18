const request = require('supertest');
const app = require('../app');

const buildUserPayload = (overrides = {}) => ({
  email: 'test.user@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  maritalStatus: 'never_married',
  religiousLevel: 'practicing',
  prayerFrequency: '5_times_daily',
  location: {
    country: 'Singapore',
    city: 'Singapore',
  },
  wali: {
    hasWali: false,
  },
  ...overrides,
});

describe('Auth routes', () => {
  test('registers a new user and returns a token', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(buildUserPayload());

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toMatchObject({
      email: 'test.user@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
  });

  test('logs in an existing user with valid credentials', async () => {
    const payload = buildUserPayload({ email: 'login.user@example.com' });
    await request(app).post('/api/auth/register').send(payload);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toMatchObject({
      email: payload.email,
      firstName: payload.firstName,
    });
  });
});
