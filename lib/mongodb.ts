import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm-project';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

mongoose.set('strictQuery', false);

// Define a custom interface for the global object to avoid TypeScript errors
interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

// Add mongoose to the NodeJS global type
declare global {
  var mongoose: { 
    conn: mongoose.Mongoose | null; 
    promise: Promise<mongoose.Mongoose> | null 
  } | undefined;
}

// Cache the database connection
const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Create a global object if it doesn't exist
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectToDatabase(): Promise<mongoose.Mongoose> {
  // If we have a connection, return it
  if (cached.conn) {
    return cached.conn;
  }

  // If we don't have a promise to connect yet, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB successfully at:', MONGODB_URI);
      return mongoose;
    }).catch(err => {
      console.error('MongoDB connection error:', err);
      throw err;
    });
  }

  // Wait for the promise to resolve
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
  
  return cached.conn;
}

export default connectToDatabase;
