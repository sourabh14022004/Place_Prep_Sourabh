/**
 * backend/src/scripts/fix-sysd-mislabeled.ts
 *
 * Corrects 5 pre-Phase-1 records mislabeled as System Design.
 * "Minimized Maximum of Products Distributed to Any Store" is a DSA
 * (heap / binary-search) problem — not a system design question.
 *
 * Filter: { roundType: 'System Design', isSeeded: true }
 * Write:  { roundType: 'Coding', questionType: 'dsa' }
 *
 * Usage:
 *   ts-node -P tsconfig.json src/scripts/fix-sysd-mislabeled.ts
 *   ts-node -P tsconfig.json src/scripts/fix-sysd-mislabeled.ts --write
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

const DRY_RUN = !process.argv.includes('--write');
const FILTER  = { roundType: 'System Design', isSeeded: true };
const UPDATE  = { $set: { roundType: 'Coding', questionType: 'dsa' } };

async function main(): Promise<void> {
  console.log(`\n  fix-sysd-mislabeled  [${DRY_RUN ? 'DRY-RUN' : 'WRITE  '}]\n`);

  await connectDB();
  const col = mongoose.connection.collection('questions');

  const count = await col.countDocuments(FILTER);
  console.log(`  Records matching filter: ${count}`);

  const samples = await col
    .find(FILTER, { projection: { problemSummary: 1, roundType: 1, questionType: 1, _id: 0 } })
    .toArray();

  console.log('\n  Titles to be updated:');
  (samples as any[]).forEach((s, i) =>
    console.log(`    ${i + 1}. "${s.problemSummary}"  [roundType=${s.roundType}, questionType=${s.questionType}]`)
  );
  console.log(`\n  Will set → roundType: 'Coding', questionType: 'dsa'\n`);

  if (DRY_RUN) {
    console.log('  Dry-run — no documents modified. Pass --write to apply.\n');
    await mongoose.disconnect();
    return;
  }

  const result = await col.updateMany(FILTER, UPDATE);
  console.log(`  Modified: ${result.modifiedCount}`);

  const remaining = await col.countDocuments(FILTER);
  console.log(`  Remaining { roundType: 'System Design', isSeeded: true }: ${remaining} (expect 0)`);

  const newTotal = await col.countDocuments({ roundType: 'System Design' });
  console.log(`  New total roundType:"System Design": ${newTotal} (expect 39)\n`);

  await mongoose.disconnect();
}

main().catch(async err => {
  console.error('[fatal]', err);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
