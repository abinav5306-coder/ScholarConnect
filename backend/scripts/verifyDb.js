import { connectDB, getCollections, closeDB } from '../config/db.js';

async function verifyAll() {
  console.log('=== Verifying MongoDB Atlas Collections ===');
  try {
    await connectDB();
    const cols = getCollections();
    const collectionNames = ['users', 'opportunities', 'applications', 'messages', 'notifications'];

    for (const name of collectionNames) {
      const count = await cols[name].countDocuments();
      console.log(`✅ Collection "${name}": ${count} document(s) found.`);
      if (count > 0) {
        const sample = await cols[name].findOne();
        console.log(`   Sample ID from ${name}: ${sample._id}`);
      }
    }
    console.log('=== All 5 collections verified successfully! ===');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await closeDB();
  }
}

verifyAll();

