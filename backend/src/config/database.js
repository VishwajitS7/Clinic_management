const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error(' [Database Error]: MONGODB_URI is not defined in environment variables.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(` MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error(` [Database Connection Error]: ${error.message}`);
    console.warn('⚠️  Application running with limited database connectivity. Please ensure MongoDB Atlas or local MongoDB is running.');
    return false;
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️  MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log(' MongoDB reconnected.');
});

const isDbConnected = () => isConnected && mongoose.connection.readyState === 1;

module.exports = {
  connectDB,
  isDbConnected,
};
