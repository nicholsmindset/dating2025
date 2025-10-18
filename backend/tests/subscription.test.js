const request = require('supertest');

const mockConstructEvent = jest.fn(() => ({
  id: 'evt_test_123',
  type: 'checkout.session.completed',
}));

jest.mock('stripe', () => {
  return jest.fn(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }));
});

const handleWebhookMock = jest.fn().mockResolvedValue(undefined);

jest.mock('../services/paymentService', () => ({
  handleWebhook: handleWebhookMock,
}));

const app = require('../app');

describe('Subscription webhook', () => {
  beforeEach(() => {
    mockConstructEvent.mockClear();
    handleWebhookMock.mockClear();
  });

  test('processes webhook events with a verified signature', async () => {
    const payload = JSON.stringify({ id: 'evt_test_123', object: 'event' });

    const response = await request(app)
      .post('/api/subscription/webhook')
      .set('stripe-signature', 'test-signature')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ received: true });
    expect(mockConstructEvent).toHaveBeenCalled();
    const [rawBody, signature, secret] = mockConstructEvent.mock.calls[0];
    expect(Buffer.isBuffer(rawBody)).toBe(true);
    expect(rawBody.toString()).toBe(payload);
    expect(signature).toBe('test-signature');
    expect(secret).toBe(process.env.STRIPE_WEBHOOK_SECRET);
    expect(handleWebhookMock).toHaveBeenCalledWith({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
    });
  });
});
