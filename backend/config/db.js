import mongoose from 'mongoose';

const connectDB = async () => {
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected! Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully.');
  });

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chemistry_db', {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn("Continuing server initialization. Make sure MONGODB_URI is valid if working with real database.");
  }
};

export default connectDB;
