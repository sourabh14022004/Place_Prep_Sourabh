/**
 * One-off: clean source 23 (CSE-Aptitude-Test-Practice-Hub) aptitude_mcq records.
 * 1. Delete 17 boilerplate records parsed from root README.md.
 * 2. Strip "Question: " prefix from 1,773 real question records via $replaceOne aggregation.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

const ROOT_README_URL =
  'https://github.com/rohanmistry231/CSE-Aptitude-Test-Practice-Hub/blob/master/README.md';

async function main() {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  const delResult = await col.deleteMany({
    sourceId: 23,
    sourceUrl: ROOT_README_URL,
  });
  console.log(`Deleted: ${delResult.deletedCount} boilerplate records`);

  const updResult = await col.updateMany(
    { sourceId: 23, problemSummary: /^Question: / },
    [{ $set: { problemSummary: { $replaceOne: { input: '$problemSummary', find: 'Question: ', replacement: '' } } } }]
  );
  console.log(`Updated: ${updResult.modifiedCount} records — "Question: " prefix stripped`);

  const remaining = await col.countDocuments({ sourceId: 23, problemSummary: /^Question: / });
  console.log(`Remaining with prefix: ${remaining} (expect 0)`);

  const totalSrc23 = await col.countDocuments({ sourceId: 23 });
  console.log(`Total source 23 records in DB: ${totalSrc23} (expect 1773)`);

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
