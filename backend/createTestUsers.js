const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const config = require('./config/env');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const testUsers = [
  {
    email: 'ahmed.test@example.com',
    password: 'password123',
    firstName: 'Ahmed',
    lastName: 'Hassan',
    gender: 'male',
    dateOfBirth: new Date('1990-05-15'),
    location: {
      country: 'Singapore',
      city: 'Singapore'
    },
    maritalStatus: 'never_married',
    religiousLevel: 'practicing',
    prayerFrequency: '5_times_daily',
    wali: {
      hasWali: true,
      waliName: 'Hassan Ahmed',
      waliRelation: 'father',
      waliContact: '+65 9123 4567',
      waliEmail: 'hassan.ahmed@example.com'
    }
  },
  {
    email: 'fatima.test@example.com',
    password: 'password123',
    firstName: 'Fatima',
    lastName: 'Ali',
    gender: 'female',
    dateOfBirth: new Date('1992-08-20'),
    location: {
      country: 'Singapore',
      city: 'Singapore'
    },
    maritalStatus: 'widow',
    religiousLevel: 'practicing',
    prayerFrequency: '5_times_daily',
    hijabWearing: 'always',
    wali: {
      hasWali: true,
      waliName: 'Ali Rahman',
      waliRelation: 'father',
      waliContact: '+65 9876 5432',
      waliEmail: 'ali.rahman@example.com'
    }
  },
  {
    email: 'omar.test@example.com',
    password: 'password123',
    firstName: 'Omar',
    lastName: 'Ibrahim',
    gender: 'male',
    dateOfBirth: new Date('1988-12-10'),
    location: {
      country: 'Singapore',
      city: 'Singapore'
    },
    maritalStatus: 'divorced',
    religiousLevel: 'practicing',
    prayerFrequency: '5_times_daily',
    wali: {
      hasWali: false
    }
  },
  {
    email: 'aisha.test@example.com',
    password: 'password123',
    firstName: 'Aisha',
    lastName: 'Mohamed',
    gender: 'female',
    dateOfBirth: new Date('1995-03-25'),
    location: {
      country: 'Singapore',
      city: 'Singapore'
    },
    maritalStatus: 'separated',
    religiousLevel: 'practicing',
    prayerFrequency: '5_times_daily',
    hijabWearing: 'sometimes',
    wali: {
      hasWali: true,
      waliName: 'Mohamed Abdullah',
      waliRelation: 'father',
      waliContact: '+65 9555 1234',
      waliEmail: 'mohamed.abdullah@example.com'
    }
  }
];

async function createTestUsers() {
  try {
    // Clear existing test users
    await User.deleteMany({ email: { $regex: /\.test@/ } });
    console.log('Cleared existing test users');

    // Create new test users
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created test user: ${userData.email}`);
    }

    console.log('\n=== TEST USERS CREATED ===');
    console.log('You can now login with these accounts:');
    testUsers.forEach(user => {
      console.log(`Email: ${user.email} | Password: ${user.password} | Gender: ${user.gender}`);
    });
    console.log('========================\n');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUsers();