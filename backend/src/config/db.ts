import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';

export async function connectDB(): Promise<void> {
  try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }

  // Surface connection issues that happen after the initial connect.
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}
