/**
 * One-off script: drops the illegal parallel-array compound index from the
 * questions collection so that the seed can run without error.
 * Run: ts-node src/scripts/drop-bad-index.ts
 */
import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placeprep';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const db = mongoose.connection.db!;
  const col = db.collection('questions');

  // List existing indexes so we know what to drop
  const indexes = await col.indexes();
  console.log('Current indexes on questions:');
  indexes.forEach((idx) => console.log(' ', JSON.stringify(idx.key)));

  // Drop the bad compound index (topics + targetRoles = parallel arrays)
  const badIndexName = indexes.find((idx) =>
    idx.key && idx.key.topics !== undefined && idx.key.targetRoles !== undefined
  )?.name;

  if (badIndexName) {
    await col.dropIndex(badIndexName);
    console.log(`\n✅ Dropped bad index: ${badIndexName}`);
  } else {
    console.log('\n⚠️  Bad index not found — may already be dropped.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
