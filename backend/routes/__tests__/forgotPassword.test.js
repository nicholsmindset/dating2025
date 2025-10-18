const originalEnv = { ...process.env };

describe('forgotPasswordHandler', () => {
  let sendPasswordResetEmail;
  let userMock;
  let forgotPasswordHandler;

  const createResponse = () => {
    const res = {
      statusCode: 200,
      jsonData: null
    };
    res.status = jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation((data) => {
      res.jsonData = data;
      return res;
    });
    return res;
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret',
      MAILER_HOST: 'smtp.example.com',
      MAILER_PORT: '587',
      MAILER_SECURE: 'false',
      MAILER_USER: 'mailer-user',
      MAILER_PASSWORD: 'mailer-password',
      MAILER_FROM_EMAIL: 'no-reply@example.com',
      MAILER_FROM_NAME: 'Dating Support',
      MAILER_RESET_URL: 'https://example.com/reset'
    };

    jest.doMock('../../services/mailerService', () => ({
      sendPasswordResetEmail: jest.fn().mockResolvedValue()
    }));

    userMock = {
      findOne: jest.fn()
    };
    jest.doMock('../../models/User', () => userMock);

    const authRouter = require('../../routes/auth');
    sendPasswordResetEmail = require('../../services/mailerService').sendPasswordResetEmail;
    forgotPasswordHandler = authRouter.forgotPasswordHandler;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('sends reset instructions without leaking the token', async () => {
    const mockUser = {
      _id: 'user-id',
      email: 'person@example.com',
      firstName: 'Test',
      save: jest.fn().mockResolvedValue()
    };
    userMock.findOne.mockResolvedValue(mockUser);

    const req = {
      body: { email: 'person@example.com' }
    };
    const res = createResponse();

    await forgotPasswordHandler(req, res);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
    expect(res.jsonData.resetToken).toBeUndefined();

    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(mockUser.resetPasswordToken).toEqual(expect.any(String));
    expect(mockUser.resetPasswordExpire).toBeInstanceOf(Date);

    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const mailerArgs = sendPasswordResetEmail.mock.calls[0][0];
    expect(mailerArgs).toMatchObject({
      email: 'person@example.com',
      firstName: 'Test'
    });
    expect(typeof mailerArgs.resetToken).toBe('string');
    expect(mailerArgs.resetToken).toBe(mockUser.resetPasswordToken);
  });

  it('does not invoke the mailer when the user is missing', async () => {
    userMock.findOne.mockResolvedValue(null);

    const req = {
      body: { email: 'unknown@example.com' }
    };
    const res = createResponse();

    await forgotPasswordHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No user found with this email address'
    });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
