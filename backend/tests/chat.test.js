const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Chat = require('../models/Chat');

const buildUserPayload = (overrides = {}) => ({
  email: `chat.user+${new mongoose.Types.ObjectId()}@example.com`,
  password: 'password123',
  firstName: 'Chat',
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

describe('Chat routes', () => {
  test('allows a participant to send a message in an existing chat', async () => {
    const senderRegistration = await request(app)
      .post('/api/auth/register')
      .send(buildUserPayload({ email: 'chat.sender@example.com' }));
    const recipientRegistration = await request(app)
      .post('/api/auth/register')
      .send(buildUserPayload({ email: 'chat.recipient@example.com' }));

    const chat = await Chat.createNewChat(
      senderRegistration.body.user._id,
      recipientRegistration.body.user._id
    );

    const response = await request(app)
      .post(`/api/chat/${chat._id}/messages`)
      .set('Authorization', `Bearer ${senderRegistration.body.token}`)
      .send({ content: 'Salaam! How are you?' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('content', 'Salaam! How are you?');
    expect(response.body).toHaveProperty('sender');
  });
});
