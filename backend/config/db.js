const mongoose = require('mongoose');

const connectDB = async (uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/islamic-dating') => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', false);

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return mongoose.connection;
};

module.exports = connectDB;
