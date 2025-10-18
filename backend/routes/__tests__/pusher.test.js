const mongoose = require('mongoose');

jest.mock('../../services/pusherService', () => ({
  pusher: {
    authenticate: jest.fn(() => ({ auth: 'token' }))
  }
}));

jest.mock('../../models/Chat', () => ({
  findById: jest.fn()
}));

const { pusher } = require('../../services/pusherService');
const Chat = require('../../models/Chat');
const { authenticateChannel } = require('../pusher').handlers;

const testUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
const chatId = '507f1f77bcf86cd799439099';

const createReq = (overrides = {}) => ({
  body: {
    socket_id: '123.456',
    channel_name: `private-chat-${chatId}`,
    ...overrides.body
  },
  user: {
    userId: testUserId,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    profilePhoto: 'https://example.com/avatar.jpg',
    gender: 'male',
    isVerified: true,
    ...overrides.user
  }
});

const createRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = function(statusCode) {
    this.statusCode = statusCode;
    return this;
  };
  res.json = function(payload) {
    this.body = payload;
    return this;
  };
  res.send = function(payload) {
    this.body = payload;
    return this;
  };
  return res;
};

describe('authenticateChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Chat.findById.mockReset();
    pusher.authenticate.mockReturnValue({ auth: 'token' });
  });

  it('denies access when the user is not a participant', async () => {
    Chat.findById.mockResolvedValue({
      participants: [new mongoose.Types.ObjectId('507f1f77bcf86cd799439022')]
    });

    const req = createReq();
    const res = createRes();

    await authenticateChannel(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(Chat.findById).toHaveBeenCalledWith(chatId);
    expect(pusher.authenticate).not.toHaveBeenCalled();
  });

  it('authorizes access for valid chat participants', async () => {
    Chat.findById.mockResolvedValue({
      participants: [testUserId, new mongoose.Types.ObjectId()]
    });

    const req = createReq({
      body: {
        socket_id: '654.321'
      }
    });
    const res = createRes();

    await authenticateChannel(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ auth: 'token' });
    expect(Chat.findById).toHaveBeenCalledWith(chatId);
    expect(pusher.authenticate).toHaveBeenCalledWith('654.321', `private-chat-${chatId}`);
  });
});
