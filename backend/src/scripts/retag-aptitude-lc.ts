/**
 * Re-tags aptitude_mcq records that have a leetcodeUrl and no MCQ options[].
 * These are confirmed LeetCode/coding problems mistagged as aptitude.
 *
 * Filter: { questionType: 'aptitude_mcq', verified: true,
 *           'options.0': { $exists: false },
 *           leetcodeUrl: { $exists: true, $nin: [null, ''] } }
 * Write:  { questionType: 'dsa', roundType: 'Coding' }
 *
 * Usage:
 *   ts-node -P tsconfig.json src/scripts/retag-aptitude-lc.ts
 *   ts-node -P tsconfig.json src/scripts/retag-aptitude-lc.ts --write
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

const DRY_RUN = !process.argv.includes('--write');
const FILTER = {
  questionType: 'aptitude_mcq',
  verified: true,
  options: { $exists: false },
  source: { $in: [
    'github/krishnadey30-leetcode-companywise',
    'github/snehasishroy-leetcode-companywise',
  ] },
};
const UPDATE = { $set: { questionType: 'dsa', roundType: 'Coding' } };

async function main() {
  console.log(`\n  retag-aptitude-lc  [${DRY_RUN ? 'DRY-RUN' : 'WRITE  '}]\n`);
  await connectDB();
  const col = mongoose.connection.collection('questions');

  const count = await col.countDocuments(FILTER);
  console.log(`  Records matching filter: ${count}`);

  // Show 5 sample titles so we can confirm these are coding problems
  const samples = await col.find(
    FILTER,
    { projection: { problemSummary: 1, leetcodeUrl: 1, roundType: 1, difficulty: 1, _id: 0 } }
  ).limit(5).toArray();

  console.log('\n  Sample titles (will be re-tagged dsa / Coding):');
  (samples as any[]).forEach((r, i) =>
    console.log(`    ${i+1}. "${r.problemSummary}"  [${r.roundType} → Coding]  ${r.leetcodeUrl}`)
  );
  console.log(`\n  Will set → questionType: 'dsa', roundType: 'Coding'\n`);

  if (DRY_RUN) {
    console.log('  Dry-run — no documents modified. Pass --write to apply.\n');
    await mongoose.disconnect();
    return;
  }

  const result = await col.updateMany(FILTER, UPDATE);
  console.log(`  Modified: ${result.modifiedCount}`);

  const remaining = await col.countDocuments(FILTER);
  console.log(`  Remaining after write: ${remaining} (expect 0)`);

  const newAptCount = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true });
  const withRealMcq = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true, isMcq: true });
  console.log(`\n  aptitude_mcq (verified) remaining: ${newAptCount}`);
  console.log(`  of which isMcq:true (real MCQ):    ${withRealMcq}\n`);

  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
