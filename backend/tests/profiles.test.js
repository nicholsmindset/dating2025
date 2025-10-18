const request = require('supertest');
const app = require('../app');

const userPayload = {
  email: 'profile.user@example.com',
  password: 'password123',
  firstName: 'Profile',
  lastName: 'Tester',
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
};

describe('Profile routes', () => {
  test('returns the authenticated user profile', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send(userPayload);
    const token = registerResponse.body.token;

    const response = await request(app)
      .get('/api/profiles/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('email', userPayload.email);
    expect(response.body).toHaveProperty('firstName', userPayload.firstName);
  });
});
