/**
 * backend/src/scripts/backfill-verified.ts
 *
 * Sets verified: true on all pre-Phase-1 seeded records.
 * Signal used: { isSeeded: true, verified: false }
 *   - isSeeded: true  → original seeded corpus (never Phase 7 scraped records)
 *   - verified: false → not yet approved (13 already-true records are excluded by this predicate)
 *
 * Phase 7 scraped records (isSeeded absent, sourceId present) are never touched.
 *
 * Usage:
 *   npx ts-node -P backend/tsconfig.json backend/src/scripts/backfill-verified.ts
 *   npx ts-node -P backend/tsconfig.json backend/src/scripts/backfill-verified.ts --write
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import Question from '../models/Question';

const DRY_RUN = !process.argv.includes('--write');
const FILTER  = { isSeeded: true, verified: false };

async function main(): Promise<void> {
  console.log(`\n  backfill-verified  [${DRY_RUN ? 'DRY-RUN' : 'WRITE  '}]\n`);

  await connectDB();

  const count = await Question.countDocuments(FILTER);
  console.log(`  Records matching { isSeeded: true, verified: false }: ${count}`);

  if (DRY_RUN) {
    console.log('\n  Dry-run — no documents modified. Pass --write to apply.\n');
    await mongoose.disconnect();
    return;
  }

  const result = await Question.updateMany(FILTER, { $set: { verified: true } });
  console.log(`  Modified: ${result.modifiedCount}`);

  const remaining = await Question.countDocuments(FILTER);
  console.log(`  Remaining unverified seeded records: ${remaining} (expect 0)\n`);

  await mongoose.disconnect();
}

main().catch(async err => {
  console.error('[fatal]', err);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
