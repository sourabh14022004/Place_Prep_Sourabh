/**
 * Corrects 314 legacy seeded records where questionType was incorrectly set to
 * 'hr_behavioral' based on roundType alone. These are DSA/coding problems that
 * happened to appear in an HR interview round; their roundType stays unchanged.
 *
 * Filter:  { sourceId: { $exists: false }, questionType: 'hr_behavioral', roundType: { $in: ['HR', 'Managerial'] } }
 * Update:  { $set: { questionType: 'dsa' } }
 *
 * Usage:
 *   ts-node -P tsconfig.json src/scripts/backfill-hr-questiontype.ts            # dry-run
 *   ts-node -P tsconfig.json src/scripts/backfill-hr-questiontype.ts --write    # live
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

const DRY_RUN = !process.argv.includes('--write');

const FILTER = {
  sourceId:     { $exists: false },
  questionType: 'hr_behavioral',
  roundType:    { $in: ['HR', 'Managerial'] },
};

async function main() {
  console.log(`\n  backfill-hr-questiontype  [${DRY_RUN ? 'DRY-RUN' : 'WRITE  '}]\n`);
  await connectDB();
  const col = mongoose.connection.collection('questions');

  const matched = await col.countDocuments(FILTER);
  console.log(`  Matched records:  ${matched}`);

  if (DRY_RUN) {
    const sample = await col.find(FILTER).limit(6)
      .project({ problemSummary: 1, roundType: 1, questionType: 1 }).toArray();
    console.log('\n  Sample (first 6):');
    for (const q of sample) {
      console.log(`    roundType=${q.roundType} | ${String(q.problemSummary ?? '').slice(0, 70)}`);
    }
    console.log('\n  Dry-run — no MongoDB changes. Pass --write to apply.\n');
    await mongoose.disconnect();
    return;
  }

  // Snapshot other-questionType counts to verify nothing else moves
  const hrBefore  = await col.countDocuments({ questionType: 'hr_behavioral' });
  const dsaBefore = await col.countDocuments({ questionType: 'dsa' });

  const result = await col.updateMany(FILTER, {
    $set: { questionType: 'dsa', updatedAt: new Date() },
  });
  console.log(`\n  Modified: ${result.modifiedCount}`);

  const hrAfter  = await col.countDocuments({ questionType: 'hr_behavioral' });
  const dsaAfter = await col.countDocuments({ questionType: 'dsa' });

  console.log(`\n  hr_behavioral: ${hrBefore} → ${hrAfter}  (Δ ${hrAfter - hrBefore})`);
  console.log(`  dsa:           ${dsaBefore} → ${dsaAfter}  (Δ ${dsaAfter - dsaBefore})`);

  const expectedHr  = hrBefore  - result.modifiedCount;
  const expectedDsa = dsaBefore + result.modifiedCount;
  if (hrAfter !== expectedHr || dsaAfter !== expectedDsa) {
    console.error('  WARNING: counts do not add up — investigate.');
  } else {
    console.log('  Counts reconcile ✓');
  }

  console.log('\n  Done.\n');
  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
