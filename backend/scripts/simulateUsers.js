/**
 * User Simulation Script
 *
 * This script simulates user workflows to test the platform:
 * 1. User registration
 * 2. Email verification
 * 3. Profile completion
 * 4. Browsing matches
 * 5. Liking profiles
 * 6. Sending messages
 * 7. Wali oversight
 *
 * Usage: node backend/scripts/simulateUsers.js [options]
 *
 * Options:
 *   --users=<number>     Number of users to create (default: 10)
 *   --skip-verification  Skip email verification step
 *   --auto-approve       Auto-approve wali permissions
 *   --create-matches     Create mutual matches
 *   --send-messages      Send test messages
 *   --clean              Clean up test data before creating new users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Wali = require('../models/Wali');
const Chat = require('../models/Chat');
const Match = require('../models/Match');

// Configuration
const args = process.argv.slice(2);
const config = {
  userCount: parseInt(args.find(arg => arg.startsWith('--users='))?.split('=')[1]) || 10,
  skipVerification: args.includes('--skip-verification'),
  autoApproveWali: args.includes('--auto-approve'),
  createMatches: args.includes('--create-matches'),
  sendMessages: args.includes('--send-messages'),
  clean: args.includes('--clean')
};

console.log('📝 Configuration:', config);

// Sample data generators
const generateUserData = (index) => {
  const gender = index % 2 === 0 ? 'male' : 'female';
  const firstName = gender === 'male' ? faker.name.firstName('male') : faker.name.firstName('female');
  const lastName = faker.name.lastName();

  return {
    email: `test.user${index}@example.com`,
    password: 'Test123456',
    firstName,
    lastName,
    dateOfBirth: faker.date.between('1990-01-01', '2000-12-31'),
    gender,
    maritalStatus: faker.random.arrayElement(['never_married', 'widow', 'divorced']),
    religiousLevel: faker.random.arrayElement(['practicing', 'moderate', 'learning']),
    prayerFrequency: faker.random.arrayElement(['5_times_daily', 'regularly', 'sometimes']),
    hijabWearing: gender === 'female' ? faker.random.arrayElement(['always', 'sometimes', 'no']) : undefined,
    location: {
      country: faker.address.country(),
      city: faker.address.city(),
      coordinates: {
        lat: parseFloat(faker.address.latitude()),
        lng: parseFloat(faker.address.longitude())
      }
    },
    bio: faker.lorem.paragraph(),
    occupation: faker.name.jobTitle(),
    education: faker.random.arrayElement(['high_school', 'bachelor', 'master', 'phd']),
    height: faker.datatype.number({ min: 150, max: 200 }),
    ethnicity: faker.random.arrayElement(['Arab', 'South Asian', 'African', 'European', 'Asian']),
    languages: [faker.random.arrayElement(['English', 'Arabic', 'Urdu', 'Turkish', 'Malay'])],
    interests: faker.random.arrayElements(
      ['Reading', 'Travel', 'Cooking', 'Sports', 'Arts', 'Technology', 'Nature', 'Music'],
      faker.datatype.number({ min: 2, max: 5 })
    ),
    wali: gender === 'female' ? {
      hasWali: true,
      waliName: faker.name.firstName('male') + ' ' + faker.name.lastName(),
      waliRelation: faker.random.arrayElement(['father', 'brother', 'uncle', 'guardian']),
      waliContact: faker.phone.phoneNumber(),
      waliEmail: `wali${index}@example.com`
    } : { hasWali: false },
    isVerified: config.skipVerification,
    accountStatus: config.skipVerification ? 'active' : 'pending',
    profileCompletion: 85,
    subscription: {
      plan: faker.random.arrayElement(['free', 'premium', 'vip']),
      status: 'active',
      profileViewsThisMonth: 0,
      lastResetDate: new Date()
    }
  };
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/islamic-dating');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clean up test data
const cleanUpTestData = async () => {
  console.log('🧹 Cleaning up test data...');

  try {
    await User.deleteMany({ email: /test\.user\d+@example\.com/ });
    await Wali.deleteMany({ email: /wali\d+@example\.com/ });
    await Chat.deleteMany({ participants: { $in: [] } }); // Clean orphaned chats
    await Match.deleteMany({}); // Clean all matches (be careful in production!)

    console.log('✅ Test data cleaned');
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
  }
};

// Create users
const createUsers = async () => {
  console.log(`👥 Creating ${config.userCount} test users...`);

  const createdUsers = [];

  for (let i = 1; i <= config.userCount; i++) {
    try {
      const userData = generateUserData(i);

      // Hash password
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await User.create(userData);
      createdUsers.push(user);

      console.log(`  ✓ Created user ${i}/${config.userCount}: ${user.firstName} ${user.lastName} (${user.email})`);

      // Create wali if applicable
      if (user.wali?.hasWali) {
        const waliData = {
          name: user.wali.waliName,
          email: user.wali.waliEmail,
          phone: user.wali.waliContact,
          relation: user.wali.waliRelation,
          ward: user._id,
          isVerified: config.autoApproveWali,
          permissions: {
            viewProfile: true,
            viewMatches: true,
            viewConversations: config.autoApproveWali,
            approveConversations: config.autoApproveWali
          }
        };

        await Wali.create(waliData);
        console.log(`    ✓ Created wali account for ${user.firstName}`);
      }

    } catch (error) {
      console.error(`  ✗ Error creating user ${i}:`, error.message);
    }
  }

  console.log(`✅ Created ${createdUsers.length} users successfully`);
  return createdUsers;
};

// Create matches
const createTestMatches = async (users) => {
  console.log('💕 Creating test matches...');

  const males = users.filter(u => u.gender === 'male');
  const females = users.filter(u => u.gender === 'female');

  let matchCount = 0;

  // Create some mutual matches
  for (let i = 0; i < Math.min(males.length, females.length); i++) {
    try {
      // Male likes female
      await User.findByIdAndUpdate(males[i]._id, {
        $addToSet: { likedProfiles: females[i]._id }
      });

      // Female likes male (mutual match)
      if (faker.datatype.boolean()) {
        await User.findByIdAndUpdate(females[i]._id, {
          $addToSet: { likedProfiles: males[i]._id }
        });

        // Create match record
        await Match.create({
          user1: males[i]._id,
          user2: females[i]._id,
          compatibilityScore: faker.datatype.number({ min: 60, max: 100 }),
          status: 'active',
          matchDate: new Date()
        });

        matchCount++;
        console.log(`  ✓ Created match: ${males[i].firstName} ↔ ${females[i].firstName}`);
      }
    } catch (error) {
      console.error(`  ✗ Error creating match:`, error.message);
    }
  }

  console.log(`✅ Created ${matchCount} matches`);
  return matchCount;
};

// Send test messages
const sendTestMessages = async (users) => {
  console.log('💬 Sending test messages...');

  // Find matches
  const matches = await Match.find({ status: 'active' }).limit(5);

  let messageCount = 0;

  for (const match of matches) {
    try {
      const user1 = users.find(u => u._id.toString() === match.user1.toString());
      const user2 = users.find(u => u._id.toString() === match.user2.toString());

      if (!user1 || !user2) continue;

      // Create chat
      const chat = await Chat.create({
        participants: [user1._id, user2._id],
        lastMessage: {
          sender: user1._id,
          content: faker.lorem.sentence(),
          timestamp: new Date()
        },
        status: 'active',
        messages: [
          {
            sender: user1._id,
            content: `As-salamu alaykum ${user2.firstName}! ${faker.lorem.sentence()}`,
            timestamp: new Date(Date.now() - 3600000),
            read: true
          },
          {
            sender: user2._id,
            content: `Wa alaykumu s-salam ${user1.firstName}! ${faker.lorem.sentence()}`,
            timestamp: new Date(Date.now() - 1800000),
            read: true
          },
          {
            sender: user1._id,
            content: faker.lorem.paragraph(),
            timestamp: new Date(Date.now() - 900000),
            read: faker.datatype.boolean()
          },
          {
            sender: user2._id,
            content: faker.lorem.sentence(),
            timestamp: new Date(),
            read: false
          }
        ]
      });

      messageCount += 4;
      console.log(`  ✓ Created conversation: ${user1.firstName} ↔ ${user2.firstName} (${chat.messages.length} messages)`);

    } catch (error) {
      console.error(`  ✗ Error sending messages:`, error.message);
    }
  }

  console.log(`✅ Sent ${messageCount} messages`);
};

// Generate summary
const generateSummary = async () => {
  console.log('\n📊 Platform Summary:');
  console.log('='.repeat(50));

  const totalUsers = await User.countDocuments({});
  const maleUsers = await User.countDocuments({ gender: 'male' });
  const femaleUsers = await User.countDocuments({ gender: 'female' });
  const verifiedUsers = await User.countDocuments({ isVerified: true });
  const premiumUsers = await User.countDocuments({ 'subscription.plan': { $in: ['premium', 'vip'] } });
  const totalWalis = await Wali.countDocuments({});
  const totalMatches = await Match.countDocuments({});
  const totalChats = await Chat.countDocuments({});

  console.log(`Total Users:        ${totalUsers}`);
  console.log(`  ├─ Male:          ${maleUsers}`);
  console.log(`  └─ Female:        ${femaleUsers}`);
  console.log(`Verified Users:     ${verifiedUsers}`);
  console.log(`Premium Users:      ${premiumUsers}`);
  console.log(`Wali Accounts:      ${totalWalis}`);
  console.log(`Active Matches:     ${totalMatches}`);
  console.log(`Conversations:      ${totalChats}`);
  console.log('='.repeat(50));

  // Sample user credentials
  console.log('\n🔑 Sample User Credentials:');
  console.log('All passwords: Test123456\n');

  const sampleUsers = await User.find({ email: /test\.user/ }).limit(5).select('email firstName lastName gender');
  sampleUsers.forEach((user, i) => {
    console.log(`${i + 1}. Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName} (${user.gender})`);
  });
};

// Main execution
const main = async () => {
  console.log('🚀 Islamic Dating Platform - User Simulation Script');
  console.log('='.repeat(50));
  console.log();

  try {
    // Connect to database
    await connectDB();

    // Clean up if requested
    if (config.clean) {
      await cleanUpTestData();
      console.log();
    }

    // Create users
    const users = await createUsers();
    console.log();

    // Create matches
    if (config.createMatches && users.length > 1) {
      await createTestMatches(users);
      console.log();
    }

    // Send messages
    if (config.sendMessages && users.length > 1) {
      await sendTestMessages(users);
      console.log();
    }

    // Generate summary
    await generateSummary();

    console.log('\n✅ Simulation completed successfully!');
    console.log('\n💡 Tips:');
    console.log('  - Login with any test user email and password "Test123456"');
    console.log('  - Browse profiles, like users, and start conversations');
    console.log('  - Test wali dashboard with wali credentials');
    console.log('  - Admin dashboard requires admin role (create manually)');

  } catch (error) {
    console.error('\n❌ Error running simulation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
};

// Run the script
main();
