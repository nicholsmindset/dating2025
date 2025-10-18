const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

class PaymentService {
  // Create a payment intent for subscription
  static async createPaymentIntent(userId, amount = 2300) { // 23 SGD in cents
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'sgd',
        customer: user.stripeCustomerId,
        metadata: {
          userId: userId.toString(),
          subscriptionType: 'premium',
          planDuration: '1_month'
        },
        description: 'Islamic Dating App Premium Subscription - 1 Month'
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Create or retrieve Stripe customer
  static async createOrGetCustomer(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.stripeCustomerId) {
        // Retrieve existing customer
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        return customer;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.firstName + ' ' + user.lastName,
        metadata: {
          userId: userId.toString()
        }
      });

      // Save customer ID to user
      user.stripeCustomerId = customer.id;
      await user.save();

      return customer;
    } catch (error) {
      console.error('Error creating/getting customer:', error);
      throw error;
    }
  }

  // Create subscription
  static async createSubscription(userId, paymentMethodId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Ensure customer exists
      const customer = await this.createOrGetCustomer(userId);

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: 'sgd',
            product_data: {
              name: 'Islamic Dating App Premium',
              description: 'Full access to all profiles and features'
            },
            unit_amount: 2300, // 23 SGD
            recurring: {
              interval: 'month'
            }
          }
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId.toString()
        }
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Handle successful payment
  static async handleSuccessfulPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const userId = paymentIntent.metadata.userId;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update user subscription
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      user.subscription = {
        ...user.subscription,
        plan: 'premium',
        isPremium: true,
        status: 'active',
        startDate: now,
        endDate: expiryDate,
        stripeSubscriptionId: paymentIntent.id,
        stripeCustomerId: paymentIntent.customer,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        profileViewsThisMonth: 0,
        lastResetDate: now
      };

      await user.save();

      return user;
    } catch (error) {
      console.error('Error handling successful payment:', error);
      throw error;
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      // Cancel at period end
      const subscription = await stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true
        }
      );

      // Update user record
      user.subscription.status = 'cancelled';
      user.subscription.isPremium = false;
      user.subscription.cancelledAt = new Date();
      await user.save();

      return subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Reactivate subscription
  static async reactivateSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription?.stripeSubscriptionId) {
        throw new Error('No subscription found');
      }

      // Reactivate subscription
      const subscription = await stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false
        }
      );

      // Update user record
      user.subscription.status = 'active';
      user.subscription.isPremium = true;
      user.subscription.cancelledAt = null;
      await user.save();

      return subscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Get subscription details
  static async getSubscriptionDetails(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.subscription?.stripeSubscriptionId) {
        return {
          type: 'free',
          status: 'inactive',
          profileViewsRemaining: Math.max(0, 10 - (user.subscription?.profileViewsThisMonth || 0))
        };
      }

      const subscription = await stripe.subscriptions.retrieve(
        user.subscription.stripeSubscriptionId
      );

      return {
        type: user.subscription.plan,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        amount: user.subscription.amount,
        currency: user.subscription.currency
      };
    } catch (error) {
      console.error('Error getting subscription details:', error);
      throw error;
    }
  }

  // Handle webhook events
  static async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleSuccessfulPayment(event.data.object.id);
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const userId = subscription.metadata.userId;
            
            if (userId) {
              const user = await User.findById(userId);
              if (user) {
                // Extend subscription
                const expiryDate = new Date(subscription.current_period_end * 1000);
                user.subscription.endDate = expiryDate;
                user.subscription.status = 'active';
                await user.save();
              }
            }
          }
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          if (failedInvoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
            const userId = subscription.metadata.userId;
            
            if (userId) {
              const user = await User.findById(userId);
              if (user) {
                user.subscription.status = 'past_due';
                await user.save();
              }
            }
          }
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object;
          const userId = deletedSubscription.metadata.userId;
          
          if (userId) {
            const user = await User.findById(userId);
            if (user) {
              user.subscription.status = 'cancelled';
              user.subscription.endDate = new Date();
              await user.save();
            }
          }
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;