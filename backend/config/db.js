import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chemistry_db');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Fallback in case of local testing if MongoDB is not running (e.g. print warning instead of crashing, or crash if strict)
    console.warn("Continuing server initialization. Make sure MONGODB_URI is valid if working with real database.");
  }
};

export default connectDB;
