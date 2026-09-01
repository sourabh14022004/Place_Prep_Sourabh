/**
 * Tags all sourceId:23 isMcq:true records with cautionSource:true.
 *
 * Reason: All 132 MCQ records from CSE-Aptitude-Test-Practice-Hub have their
 * correct answer hardcoded to option B in the source — a data-quality defect
 * in the original repository. Records are flagged, not deleted.
 *
 * Usage:
 *   ts-node -P tsconfig.json src/scripts/tag-source23-mcq-caution.ts            # dry-run
 *   ts-node -P tsconfig.json src/scripts/tag-source23-mcq-caution.ts --write    # live
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

const DRY_RUN = !process.argv.includes('--write');
const FILTER = { sourceId: 23, isMcq: true };

async function main() {
  console.log(`\n  tag-source23-mcq-caution  [${DRY_RUN ? 'DRY-RUN' : 'WRITE  '}]\n`);
  await connectDB();
  const col = mongoose.connection.collection('questions');

  const matched = await col.countDocuments(FILTER);
  const alreadyFlagged = await col.countDocuments({ ...FILTER, cautionSource: true });
  const toUpdate = matched - alreadyFlagged;

  console.log(`  sourceId:23 isMcq:true total:     ${matched}`);
  console.log(`  already cautionSource:true:       ${alreadyFlagged}`);
  console.log(`  will be updated:                  ${toUpdate}`);

  if (DRY_RUN) {
    console.log('\n  Dry-run — no MongoDB changes. Pass --write to apply.\n');
    await mongoose.disconnect();
    return;
  }

  if (toUpdate === 0) {
    console.log('\n  Nothing to do — all records already flagged.\n');
    await mongoose.disconnect();
    return;
  }

  const result = await col.updateMany(
    { ...FILTER, cautionSource: { $ne: true } },
    { $set: { cautionSource: true, updatedAt: new Date() } }
  );

  console.log(`\n  Updated: ${result.modifiedCount}`);

  const afterCount = await col.countDocuments({ ...FILTER, cautionSource: true });
  console.log(`  sourceId:23 isMcq:true cautionSource:true after: ${afterCount}`);

  if (afterCount !== matched) {
    console.error(`  WARNING: expected ${matched}, only ${afterCount} flagged — investigate.`);
  } else {
    console.log('  All MCQ records flagged ✓');
  }

  console.log('\n  Done.\n');
  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
