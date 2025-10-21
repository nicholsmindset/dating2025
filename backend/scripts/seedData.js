const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const VirtualGift = require('../models/VirtualGift');
require('dotenv').config();

const subscriptionPlans = [
  {
    name: 'free',
    displayName: 'Free',
    description: 'Start your journey to find your perfect match',
    price: {
      monthly: { amount: 0, currency: 'SGD' },
      annual: { amount: 0, currency: 'SGD', discount: 0 }
    },
    features: {
      profileViewsPerMonth: 10,
      canSeeWhoLikedYou: false,
      profileBoostPerMonth: 0,
      superLikesPerMonth: 0,
      canSendVirtualGifts: false,
      prioritySupport: false,
      verificationBadge: false,
      advancedFilters: false,
      readReceipts: false,
      undoSwipes: false,
      profileAnalytics: false,
      adFree: false,
      videoIntroduction: false,
      voiceMessages: false
    },
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'basic',
    displayName: 'Basic',
    description: 'Get more visibility and connect with more matches',
    price: {
      monthly: { amount: 999, currency: 'SGD' }, // $9.99
      annual: { amount: 9590, currency: 'SGD', discount: 20 } // $95.90 (20% off)
    },
    features: {
      profileViewsPerMonth: 50,
      canSeeWhoLikedYou: true,
      profileBoostPerMonth: 1,
      superLikesPerMonth: 5,
      canSendVirtualGifts: true,
      prioritySupport: false,
      verificationBadge: false,
      advancedFilters: true,
      readReceipts: true,
      undoSwipes: true,
      profileAnalytics: false,
      adFree: true,
      videoIntroduction: false,
      voiceMessages: true
    },
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'premium',
    displayName: 'Premium',
    description: 'Unlimited access to all features and maximum visibility',
    price: {
      monthly: { amount: 2300, currency: 'SGD' }, // $23.00
      annual: { amount: 22080, currency: 'SGD', discount: 20 } // $220.80 (20% off)
    },
    features: {
      profileViewsPerMonth: -1, // Unlimited
      canSeeWhoLikedYou: true,
      profileBoostPerMonth: 3,
      superLikesPerMonth: 15,
      canSendVirtualGifts: true,
      prioritySupport: true,
      verificationBadge: true,
      advancedFilters: true,
      readReceipts: true,
      undoSwipes: true,
      profileAnalytics: true,
      adFree: true,
      videoIntroduction: true,
      voiceMessages: true
    },
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'vip',
    displayName: 'VIP',
    description: 'Ultimate experience with exclusive features and concierge support',
    price: {
      monthly: { amount: 4900, currency: 'SGD' }, // $49.00
      annual: { amount: 47040, currency: 'SGD', discount: 20 } // $470.40 (20% off)
    },
    features: {
      profileViewsPerMonth: -1, // Unlimited
      canSeeWhoLikedYou: true,
      profileBoostPerMonth: 10,
      superLikesPerMonth: 50,
      canSendVirtualGifts: true,
      prioritySupport: true,
      verificationBadge: true,
      advancedFilters: true,
      readReceipts: true,
      undoSwipes: true,
      profileAnalytics: true,
      adFree: true,
      videoIntroduction: true,
      voiceMessages: true
    },
    isActive: true,
    sortOrder: 4
  }
];

const virtualGifts = [
  // Flowers
  {
    name: 'rose',
    displayName: 'Single Rose',
    description: 'A beautiful red rose to show your interest',
    category: 'flowers',
    price: { amount: 199, currency: 'SGD' }, // $1.99
    icon: '🌹',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'bouquet',
    displayName: 'Rose Bouquet',
    description: 'A stunning bouquet of roses',
    category: 'flowers',
    price: { amount: 499, currency: 'SGD' }, // $4.99
    icon: '💐',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'tulips',
    displayName: 'Tulip Arrangement',
    description: 'Beautiful tulips to brighten their day',
    category: 'flowers',
    price: { amount: 399, currency: 'SGD' }, // $3.99
    icon: '🌷',
    isActive: true,
    sortOrder: 3
  },

  // Chocolates
  {
    name: 'chocolate_box',
    displayName: 'Box of Chocolates',
    description: 'Delicious chocolates to sweeten your message',
    category: 'chocolates',
    price: { amount: 299, currency: 'SGD' }, // $2.99
    icon: '🍫',
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'chocolate_heart',
    displayName: 'Chocolate Heart',
    description: 'A heart-shaped box of premium chocolates',
    category: 'chocolates',
    price: { amount: 599, currency: 'SGD' }, // $5.99
    icon: '❤️🍫',
    isActive: true,
    sortOrder: 5
  },

  // Islamic/Cultural
  {
    name: 'prayer_beads',
    displayName: 'Prayer Beads (Tasbih)',
    description: 'Beautiful prayer beads as a meaningful gift',
    category: 'islamic',
    price: { amount: 799, currency: 'SGD' }, // $7.99
    icon: '📿',
    isActive: true,
    sortOrder: 6
  },
  {
    name: 'quran',
    displayName: 'Beautiful Quran',
    description: 'An elegant Quran to show your values',
    category: 'islamic',
    price: { amount: 1299, currency: 'SGD' }, // $12.99
    icon: '📖',
    isActive: true,
    sortOrder: 7
  },
  {
    name: 'dates',
    displayName: 'Box of Dates',
    description: 'Premium Ajwa dates from Madinah',
    category: 'islamic',
    price: { amount: 899, currency: 'SGD' }, // $8.99
    icon: '🫐',
    isActive: true,
    sortOrder: 8
  },
  {
    name: 'lantern',
    displayName: 'Islamic Lantern',
    description: 'Beautiful decorative lantern',
    category: 'islamic',
    price: { amount: 999, currency: 'SGD' }, // $9.99
    icon: '🏮',
    isActive: true,
    sortOrder: 9
  },

  // Jewelry
  {
    name: 'ring',
    displayName: 'Ring',
    description: 'A symbolic ring to show serious intentions',
    category: 'jewelry',
    price: { amount: 1999, currency: 'SGD' }, // $19.99
    icon: '💍',
    isActive: true,
    sortOrder: 10
  },
  {
    name: 'bracelet',
    displayName: 'Bracelet',
    description: 'An elegant bracelet',
    category: 'jewelry',
    price: { amount: 1499, currency: 'SGD' }, // $14.99
    icon: '📿',
    isActive: true,
    sortOrder: 11
  },

  // Special
  {
    name: 'coffee',
    displayName: 'Coffee Invitation',
    description: 'Invite them for a halal coffee meetup',
    category: 'special',
    price: { amount: 499, currency: 'SGD' }, // $4.99
    icon: '☕',
    isActive: true,
    sortOrder: 12
  },
  {
    name: 'book',
    displayName: 'Book Gift',
    description: 'A meaningful book to share knowledge',
    category: 'special',
    price: { amount: 799, currency: 'SGD' }, // $7.99
    icon: '📚',
    isActive: true,
    sortOrder: 13
  },
  {
    name: 'star',
    displayName: 'Shining Star',
    description: 'Tell them they shine bright!',
    category: 'special',
    price: { amount: 299, currency: 'SGD' }, // $2.99
    icon: '⭐',
    isActive: true,
    sortOrder: 14
  },
  {
    name: 'crown',
    displayName: 'Royal Crown',
    description: 'Show them they are royalty',
    category: 'special',
    price: { amount: 2999, currency: 'SGD' }, // $29.99
    icon: '👑',
    isActive: true,
    sortOrder: 15
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/islamic-dating', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing subscription plans...');
    await SubscriptionPlan.deleteMany({});

    console.log('Clearing existing virtual gifts...');
    await VirtualGift.deleteMany({});

    // Seed subscription plans
    console.log('Seeding subscription plans...');
    const createdPlans = await SubscriptionPlan.insertMany(subscriptionPlans);
    console.log(`✅ Created ${createdPlans.length} subscription plans`);

    // Seed virtual gifts
    console.log('Seeding virtual gifts...');
    const createdGifts = await VirtualGift.insertMany(virtualGifts);
    console.log(`✅ Created ${createdGifts.length} virtual gifts`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nSubscription Plans:');
    createdPlans.forEach((plan) => {
      console.log(`  - ${plan.displayName}: $${plan.price.monthly.amount / 100}/month`);
    });

    console.log('\nVirtual Gifts:');
    createdGifts.forEach((gift) => {
      console.log(`  - ${gift.displayName} (${gift.icon}): $${gift.price.amount / 100}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, subscriptionPlans, virtualGifts };
