/**
 * backend/src/config/db.ts
 * MongoDB connection singleton via Mongoose.
 * Safe for use in serverless (Next.js API Routes) — cached across hot reloads.
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnection: Promise<typeof mongoose> | undefined;
}

let cachedPromise: Promise<typeof mongoose> | undefined = global.__mongooseConnection;

export async function connectDB(): Promise<typeof mongoose> {
  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('[PlacePrep] MONGODB_URI is not defined. Check your .env.local file.');
  }

  const options: mongoose.ConnectOptions = {
    bufferCommands: false,
    maxPoolSize: 50,               // raised from 10 for production load (3k+ users)
    minPoolSize: 5,                // keep warm connections
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    waitQueueTimeoutMS: 10000,     // don't let requests hang indefinitely
    family: 4,
  };

  cachedPromise = mongoose.connect(uri, options).then((m) => {
    logger.info('Connected to MongoDB Atlas');
    return m;
  }).catch((err) => {
    // CRITICAL: Reset so the next request retries instead of re-using the rejected promise
    cachedPromise = undefined;
    global.__mongooseConnection = undefined;
    logger.error({ err }, 'MongoDB connection failed');
    throw err;
  });

  // Cache in global to survive Next.js hot-reloads in development
  global.__mongooseConnection = cachedPromise;

  return cachedPromise;
}

export default connectDB;
