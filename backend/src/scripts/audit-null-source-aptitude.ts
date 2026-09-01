import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

async function main() {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  // The 1,743 null-source aptitude_mcq records with no options
  const FILTER = { questionType: 'aptitude_mcq', verified: true, options: { $exists: false }, source: null };

  const count = await col.countDocuments(FILTER);
  console.log(`\n── Null-source aptitude_mcq (no options): ${count} records ──`);

  // 10 sample titles
  const samples = await col.find(FILTER, {
    projection: { problemSummary: 1, roundType: 1, difficulty: 1, topics: 1,
                  leetcodeUrl: 1, sourceUrl: 1, isSeeded: 1, sourceId: 1, _id: 0 },
  }).limit(10).toArray();

  console.log('\n── Sample records ──');
  (samples as any[]).forEach((r, i) => {
    console.log(`  ${i+1}. "${r.problemSummary}"`);
    console.log(`     roundType=${r.roundType}  difficulty=${r.difficulty}`);
    console.log(`     topics=${JSON.stringify(r.topics)}`);
    console.log(`     leetcodeUrl=${r.leetcodeUrl ?? 'null'}  sourceUrl=${r.sourceUrl ?? 'null'}`);
    console.log(`     isSeeded=${r.isSeeded}  sourceId=${r.sourceId ?? 'null'}`);
  });

  // What roundType are these?
  const byRound = await col.aggregate([
    { $match: FILTER },
    { $group: { _id: '$roundType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  console.log('\n── By roundType ──');
  (byRound as any[]).forEach(r => console.log(`  ${String(r.count).padStart(6)}  "${r._id}"`));

  // How many have leetcodeUrl set?
  const withLc = await col.countDocuments({ ...FILTER, leetcodeUrl: { $exists: true, $nin: [null, ''] } });
  console.log(`\n  with non-empty leetcodeUrl: ${withLc}`);

  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
