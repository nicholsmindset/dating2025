const mongoose = require('mongoose');
const Chat = require('../models/Chat');

describe('Chat model helper methods', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a new chat with expected defaults', async () => {
    const participantOne = new mongoose.Types.ObjectId();
    const participantTwo = new mongoose.Types.ObjectId();

    const createSpy = jest
      .spyOn(Chat, 'create')
      .mockImplementation(async (data) => new Chat(data));

    const chat = await Chat.createNewChat(participantOne, participantTwo);

    expect(createSpy).toHaveBeenCalledWith({
      participants: [participantOne, participantTwo],
      chatType: 'direct',
      isActive: true
    });

    expect(chat.participants.map((id) => id.toString()).sort()).toEqual(
      [participantOne.toString(), participantTwo.toString()].sort()
    );
    expect(chat.chatType).toBe('direct');
    expect(chat.isActive).toBe(true);
  });

  it('creates wali-supervised chats when approval is required', async () => {
    const participantOne = new mongoose.Types.ObjectId();
    const participantTwo = new mongoose.Types.ObjectId();
    const waliUser = new mongoose.Types.ObjectId();

    const createSpy = jest
      .spyOn(Chat, 'create')
      .mockImplementation(async (data) => new Chat(data));

    await Chat.createNewChat(participantOne, participantTwo, {
      requireWaliApproval: true,
      waliUser
    });

    expect(createSpy).toHaveBeenCalled();
    const payload = createSpy.mock.calls[0][0];
    expect(payload.chatType).toBe('wali_supervised');
    expect(payload.waliSupervision.isRequired).toBe(true);
    expect(payload.waliSupervision.isApproved).toBe(false);
    expect(payload.waliSupervision.waliUser).toEqual(waliUser);
    expect(payload.isActive).toBe(true);
  });

  const buildChat = (overrides = {}) => {
    const defaults = {
      participants: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      waliSupervision: {
        isRequired: false,
        isApproved: true,
        waliCanView: true
      },
      isActive: true,
      isBlocked: false,
      messages: []
    };

    const chat = new Chat({ ...defaults, ...overrides });
    chat.save = jest.fn().mockResolvedValue(chat);
    return chat;
  };

  it('prevents participants from viewing messages until wali approval is granted', () => {
    const waliUser = new mongoose.Types.ObjectId();
    const chat = buildChat({
      waliSupervision: {
        isRequired: true,
        isApproved: false,
        waliUser,
        waliCanView: true
      }
    });

    const participantId = chat.participants[0];

    expect(chat.canUserViewMessages(participantId)).toBe(false);
    expect(chat.canUserViewMessages(waliUser)).toBe(true);

    chat.waliSupervision.isApproved = true;

    expect(chat.canUserViewMessages(participantId)).toBe(true);
  });

  it('returns the newly created message from addMessage', async () => {
    const senderId = new mongoose.Types.ObjectId();
    const chat = buildChat();
    chat.participants[0] = senderId;

    const message = await chat.addMessage(senderId, 'Salaam');

    expect(chat.save).toHaveBeenCalled();
    expect(message.content).toBe('Salaam');
    expect(message.sender.toString()).toBe(senderId.toString());
    expect(chat.lastMessage.content).toBe('Salaam');
    expect(chat.messages).toHaveLength(1);
  });

  it('verifies participant membership using ObjectId equality', () => {
    const outsider = new mongoose.Types.ObjectId();
    const chat = buildChat();

    expect(chat.canUserSendMessage(chat.participants[0])).toBe(true);
    expect(chat.canUserSendMessage(chat.participants[1])).toBe(true);
    expect(chat.canUserSendMessage(outsider)).toBe(false);
  });

  it('blocks messaging when wali approval is pending', () => {
    const participant = new mongoose.Types.ObjectId();
    const chat = buildChat({
      participants: [participant, new mongoose.Types.ObjectId()],
      waliSupervision: {
        isRequired: true,
        isApproved: false,
        waliCanView: true
      }
    });

    expect(chat.canUserSendMessage(participant)).toBe(false);
  });
});
