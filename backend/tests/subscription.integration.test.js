process.env.JWT_SECRET = 'test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';

jest.mock('stripe', () => {
  const stripeMock = {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    paymentMethods: {
      attach: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  const stripeConstructor = jest.fn(() => stripeMock);
  stripeConstructor.__mock = stripeMock;
  return stripeConstructor;
});

jest.mock('../models/User', () => {
  const { randomUUID } = require('crypto');

  const store = new Map();
  const clone = (value) => {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  };

  class UserModel {
    constructor(data = {}) {
      this._id = (data._id || randomUUID()).toString();

      Object.entries(data).forEach(([key, value]) => {
        if (key !== '_id' && key !== 'subscription' && key !== 'profileViews') {
          this[key] = clone(value);
        }
      });

      const subscription = data.subscription || {};
      this.subscription = {
        plan: 'free',
        status: 'inactive',
        profileViewsThisMonth: 0,
        lastResetDate: new Date(),
        ...clone(subscription),
      };

      this.profileViews = (data.profileViews || []).map(view => clone(view));
    }

    markModified() {}

    toObject() {
      const result = {};
      Object.entries(this).forEach(([key, value]) => {
        if (typeof value === 'function') {
          return;
        }
        result[key] = clone(value);
      });
      result._id = this._id;
      return result;
    }

    toJSON() {
      return this.toObject();
    }

    async save() {
      store.set(this._id.toString(), this.toObject());
      return this;
    }

    static async create(data) {
      const user = new UserModel(data);
      await user.save();
      return user;
    }

    static findById(id) {
      const key = id.toString();
      const record = store.get(key);

      const createDoc = () => {
        if (!record) return null;
        const doc = new UserModel({ ...clone(record), _id: key });
        doc.select = function select() {
          return this;
        };
        return doc;
      };

      const query = {
        select() {
          return this;
        },
        async exec() {
          return createDoc();
        },
        then(resolve, reject) {
          return this.exec().then(resolve, reject);
        },
        catch(reject) {
          return this.exec().catch(reject);
        }
      };

      return query;
    }

    static async deleteMany() {
      store.clear();
    }
  }

  return UserModel;
});

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const subscriptionRoutes = require('../routes/subscription');

const stripeConstructor = require('stripe');
const stripeMock = stripeConstructor.__mock;

const app = express();
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use('/api/subscription', subscriptionRoutes);

let server;
let baseUrl;

const makeRequest = async (method, path, options = {}) => {
  const { body, headers = {}, rawBody } = options;
  const fetchOptions = {
    method,
    headers: { ...headers },
  };

  if (rawBody !== undefined) {
    fetchOptions.body = rawBody;
  } else if (body !== undefined) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, fetchOptions);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch (error) {
    data = text;
  }

  return { status: response.status, body: data, headers: response.headers };
};

const createUserAndToken = async (overrides = {}) => {
  const defaultData = {
    email: `user${Date.now()}@example.com`,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    maritalStatus: 'never_married',
    religiousLevel: 'practicing',
    prayerFrequency: '5_times_daily',
    wali: { hasWali: false },
    location: { country: 'Singapore', city: 'Singapore' },
    isActive: true,
    subscription: {
      plan: 'free',
      status: 'inactive',
      profileViewsThisMonth: 0,
      lastResetDate: new Date(),
      ...overrides.subscription,
    },
    ...overrides,
  };

  const user = await User.create(defaultData);
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  return { user, token };
};

beforeAll(() => {
  server = app.listen(0);
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

beforeEach(async () => {
  await User.deleteMany({});
  jest.clearAllMocks();

  const now = Date.now();
  const currentPeriodStart = Math.floor(now / 1000);
  const currentPeriodEnd = Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000);

  stripeMock.customers.create.mockResolvedValue({ id: 'cus_new' });
  stripeMock.customers.retrieve.mockResolvedValue({ id: 'cus_existing' });
  stripeMock.customers.update.mockResolvedValue({});
  stripeMock.paymentMethods.attach.mockResolvedValue({});
  stripeMock.paymentIntents.create.mockResolvedValue({
    id: 'pi_test',
    client_secret: 'secret_test',
    amount: 2300,
    currency: 'sgd',
  });
  stripeMock.paymentIntents.retrieve.mockResolvedValue({
    id: 'pi_test',
    metadata: {},
    amount: 2300,
    currency: 'sgd',
  });
  stripeMock.subscriptions.create.mockResolvedValue({
    id: 'sub_test',
    status: 'incomplete',
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    latest_invoice: {
      payment_intent: { client_secret: 'sub_secret' },
    },
  });
  stripeMock.subscriptions.retrieve.mockResolvedValue({
    id: 'sub_test',
    status: 'active',
    metadata: { userId: 'placeholder' },
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: false,
    customer: 'cus_existing',
  });
  stripeMock.subscriptions.update.mockResolvedValue({ id: 'sub_test', status: 'active' });
  stripeMock.webhooks.constructEvent.mockImplementation((body) => JSON.parse(body.toString()));
});

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

describe('Subscription integration', () => {
  test('creates payment intent and stores Stripe customer on subscription', async () => {
    const { user, token } = await createUserAndToken();
    stripeMock.customers.create.mockResolvedValueOnce({ id: 'cus_test_create' });
    stripeMock.paymentIntents.create.mockResolvedValueOnce({
      id: 'pi_new',
      client_secret: 'secret_new',
      amount: 2300,
      currency: 'sgd',
    });

    const response = await makeRequest('POST', '/api/subscription/create-payment-intent', {
      body: {},
      headers: authHeader(token),
    });

    expect(response.status).toBe(200);
    expect(response.body.clientSecret).toBe('secret_new');

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.subscription.stripeCustomerId).toBe('cus_test_create');
    expect(updatedUser.subscription.plan).toBe('free');
  });

  test('processes invoice payment succeeded webhook and activates premium subscription', async () => {
    const { user } = await createUserAndToken();

    const now = Date.now();
    const currentPeriodStart = Math.floor(now / 1000);
    const currentPeriodEnd = Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000);

    stripeMock.subscriptions.retrieve.mockResolvedValueOnce({
      id: 'sub_test',
      status: 'active',
      metadata: { userId: user._id.toString() },
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: false,
      customer: 'cus_webhook',
    });

    const eventPayload = {
      id: 'evt_test',
      type: 'invoice.payment_succeeded',
      data: { object: { subscription: 'sub_test' } },
    };

    stripeMock.webhooks.constructEvent.mockReturnValueOnce(eventPayload);

    const response = await makeRequest('POST', '/api/subscription/webhook', {
      rawBody: JSON.stringify(eventPayload),
      headers: {
        'stripe-signature': 'sig_test',
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.subscription.plan).toBe('premium');
    expect(updatedUser.subscription.status).toBe('active');
    expect(updatedUser.subscription.stripeSubscriptionId).toBe('sub_test');
    expect(updatedUser.subscription.profileViewsThisMonth).toBe(0);
    const resetDate = updatedUser.subscription.lastResetDate;
    expect(Object.prototype.toString.call(resetDate)).toBe('[object Date]');
  });

  test('returns free plan subscription status with remaining views', async () => {
    const { user, token } = await createUserAndToken({
      subscription: {
        plan: 'free',
        status: 'inactive',
        profileViewsThisMonth: 3,
        lastResetDate: new Date(),
      },
    });

    user.profileViews = [
      { viewedBy: user._id, viewedAt: new Date() },
      { viewedBy: user._id, viewedAt: new Date() },
      { viewedBy: user._id, viewedAt: new Date() },
    ];
    await user.save();

    const response = await makeRequest('GET', '/api/subscription/status', {
      headers: authHeader(token),
    });

    expect(response.status).toBe(200);
    expect(response.body.plan).toBe('free');
    expect(response.body.status).toBe('inactive');
    expect(response.body.viewsRemaining).toBe(7);
    expect(response.body.features.unlimitedViews).toBe(false);
  });

  test('returns premium subscription status with unlimited views', async () => {
    const endDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const { user, token } = await createUserAndToken({
      subscription: {
        plan: 'premium',
        status: 'active',
        stripeSubscriptionId: 'sub_test',
        stripeCustomerId: 'cus_existing',
        startDate: new Date(),
        endDate,
        profileViewsThisMonth: 0,
        lastResetDate: new Date(),
      },
    });

    const now = Date.now();
    stripeMock.subscriptions.retrieve.mockResolvedValueOnce({
      id: 'sub_test',
      status: 'active',
      current_period_start: Math.floor(now / 1000),
      current_period_end: Math.floor((now + 30 * 24 * 60 * 60 * 1000) / 1000),
      cancel_at_period_end: false,
    });

    const response = await makeRequest('GET', '/api/subscription/status', {
      headers: authHeader(token),
    });

    expect(response.status).toBe(200);
    expect(response.body.plan).toBe('premium');
    expect(response.body.status).toBe('active');
    expect(response.body.viewsRemaining).toBe('unlimited');
    expect(response.body.features.unlimitedViews).toBe(true);
  });
});
