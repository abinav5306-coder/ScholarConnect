import { app } from '../backend/server.js';
import { connectDB } from '../backend/config/db.js';

/**
 * Vercel Serverless Function Handler
 * Wraps the Express application and ensures MongoDB Atlas is connected.
 */
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Serverless] MongoDB Atlas connection error:', err.message);
  }

  return app(req, res);
}

