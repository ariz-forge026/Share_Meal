import mongoose from 'mongoose';
import { config } from './env.js';

mongoose.set('bufferCommands', false);

export async function connectDatabase() {
  if (!config.mongoUri) return false;
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
  return true;
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}
