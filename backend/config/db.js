import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from the backend directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'scholarconnect';

let client = null;
let db = null;

/**
 * Initialize and connect to MongoDB Atlas using the official MongoDB driver.
 * Reuses a single connection pool across the application.
 */
export async function connectDB() {
  if (db) {
    return db;
  }

  const currentUri = process.env.MONGO_URI || MONGO_URI;

  if (!currentUri || currentUri.includes('<db_password>')) {
    console.warn('\n⚠️  [MongoDB Atlas Configuration Required]');
    console.warn('   The MONGO_URI in backend/.env contains the placeholder "<db_password>".');
    console.warn('   Please replace <db_password> with your actual MongoDB Atlas database user password in backend/.env.');
    console.warn('   Example: mongodb+srv://abinav5306_db_user:YourActualPassword@cluster0.ylvzila.mongodb.net/?retryWrites=true&w=majority\n');
    return null;
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      client = new MongoClient(currentUri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: 20,
        connectTimeoutMS: 15000,
      });

      await client.connect();
      db = client.db(DB_NAME);

      // Verify connection by pinging
      await db.command({ ping: 1 });
      console.log(`✅ [MongoDB Atlas Connected] Successfully connected to database: "${DB_NAME}"`);

      // Ensure indexes for performance & integrity
      await initializeIndexes(db);

      return db;
    } catch (error) {
      console.error(`❌ [MongoDB Connection Error (attempt ${attempts}/${maxAttempts})]:`, error.message);
      if (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1200));
      } else {
        db = null;
        return null;
      }
    }
  }
}

/**
 * Create indexes for frequently queried fields across collections
 */
async function initializeIndexes(database) {
  try {
    // 1. Users collection
    const users = database.collection('users');
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ role: 1 });

    // 2. Opportunities collection
    const opportunities = database.collection('opportunities');
    await opportunities.createIndex({ status: 1 });
    await opportunities.createIndex({ category: 1 });
    await opportunities.createIndex({ teacherId: 1 });
    await opportunities.createIndex({ createdAt: -1 });

    // 3. Applications collection
    const applications = database.collection('applications');
    await applications.createIndex({ opportunityId: 1, studentId: 1 }, { unique: true });
    await applications.createIndex({ studentId: 1 });
    await applications.createIndex({ opportunityId: 1 });
    await applications.createIndex({ status: 1 });

    // 4. Messages collection
    const messages = database.collection('messages');
    await messages.createIndex({ senderId: 1 });
    await messages.createIndex({ receiverId: 1 });
    await messages.createIndex({ opportunityId: 1 });
    await messages.createIndex({ receiverId: 1, isRead: 1 });
    await messages.createIndex({ opportunityId: 1, senderId: 1, receiverId: 1, createdAt: 1 });
    await messages.createIndex({ createdAt: -1 });

    // 5. Notifications collection
    const notifications = database.collection('notifications');
    await notifications.createIndex({ userId: 1, isRead: 1 });

    // 6. OTP Verifications collection
    const otpVerifications = database.collection('otp_verifications');
    await otpVerifications.createIndex({ email: 1, purpose: 1 });
    await otpVerifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL auto-cleanup

    // 7. Verification Audits collection
    const verificationAudits = database.collection('verification_audits');
    await verificationAudits.createIndex({ userId: 1 });
    await verificationAudits.createIndex({ timestamp: -1 });

    // 8. Email Delivery Logs collection
    const emailLogs = database.collection('email_logs');
    await emailLogs.createIndex({ recipientEmail: 1, type: 1 });
    await emailLogs.createIndex({ sentAt: -1 });

    console.log('📑 [MongoDB Indexes] All collection indexes verified.');
  } catch (err) {
    console.warn('⚠️  [MongoDB Index Notice]:', err.message);
  }
}

/**
 * Check if active database connection exists
 */
export function isDBConnected() {
  return db !== null;
}

/**
 * Access the active database instance.
 */
export function getDB() {
  if (!db) {
    throw new Error('Database not connected. Please ensure your MongoDB Atlas password is set in backend/.env.');
  }
  return db;
}

/**
 * Helper to get references to all standard collections
 */
export function getCollections() {
  const database = getDB();
  return {
    users: database.collection('users'),
    opportunities: database.collection('opportunities'),
    applications: database.collection('applications'),
    messages: database.collection('messages'),
    notifications: database.collection('notifications'),
    otpVerifications: database.collection('otp_verifications'),
    verificationAudits: database.collection('verification_audits'),
    emailLogs: database.collection('email_logs'),
  };
}

/**
 * Gracefully close MongoDB client on process termination
 */
export async function closeDB() {
  if (client) {
    await client.close();
    console.log('🔒 [MongoDB Client Closed]');
    client = null;
    db = null;
  }
}
