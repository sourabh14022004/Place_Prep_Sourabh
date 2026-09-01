/**
 * backend/src/scripts/backfill-question-type.ts
 *
 * Sets questionType on every Question document that is missing the field.
 * Derives the value from each document's existing roundType using the same
 * mapping documented in Question.ts — NOT a uniform 'dsa' default, because
 * pre-Phase-1 data includes HR (230), Domain (929), Aptitude (13), System Design (5),
 * and Managerial (84) records that must map to their correct questionType.
 *
 * Mapping:
 *   Coding        → dsa
 *   System Design → system_design
 *   LLD           → lld
 *   HR            → hr_behavioral
 *   Managerial    → hr_behavioral   (managerial rounds are behavioral in nature)
 *   Aptitude      → aptitude_mcq
 *   Domain        → domain_specific
 *   (anything else / null) → dsa    (safe fallback, logged for review)
 *
 * Usage (from repo root):
 *   npx ts-node -P backend/tsconfig.json backend/src/scripts/backfill-question-type.ts
 *   npx ts-node -P backend/tsconfig.json backend/src/scripts/backfill-question-type.ts --write
 *
 * Default is --dry-run. Pass --write to apply.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import Question from '../models/Question';
import type { QuestionType } from '../models/Question';

const DRY_RUN = !process.argv.includes('--write');

const ROUND_TO_QTYPE: Record<string, QuestionType> = {
  'Coding':        'dsa',
  'System Design': 'system_design',
  'LLD':           'lld',
  'HR':            'hr_behavioral',
  'Managerial':    'hr_behavioral',
  'Aptitude':      'aptitude_mcq',
  'Domain':        'domain_specific',
};

const FALLBACK: QuestionType = 'dsa';
const BATCH = 500;

async function main(): Promise<void> {
  const W    = 72;
  const mode = DRY_RUN ? 'DRY-RUN' : 'WRITE  ';

  console.log(`\n${'═'.repeat(W)}`);
  console.log(`  backfill-question-type                          [${mode}]`);
  console.log(`${'═'.repeat(W)}\n`);

  if (DRY_RUN) {
    console.log('  ℹ  Dry-run — no documents will be modified. Pass --write to apply.\n');
  }

  await connectDB();

  // 1. Count and preview distribution
  const missing = await Question.countDocuments({ questionType: { $exists: false } });
  if (missing === 0) {
    console.log('  ✓  No documents missing questionType. Nothing to do.\n');
    await mongoose.disconnect();
    return;
  }
  console.log(`  Documents missing questionType: ${missing}\n`);

  const byRoundType = await Question.aggregate([
    { $match: { questionType: { $exists: false } } },
    { $group: { _id: '$roundType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log('  roundType → questionType mapping to apply:');
  const unknowns: string[] = [];
  for (const { _id, count } of byRoundType) {
    const rt  = (_id as string | null) ?? '(null)';
    const qt  = ROUND_TO_QTYPE[rt] ?? FALLBACK;
    const flag = ROUND_TO_QTYPE[rt] ? '' : '  ⚠ unmapped — using fallback dsa';
    if (!ROUND_TO_QTYPE[rt]) unknowns.push(rt);
    console.log(`    ${rt.padEnd(16)}  →  ${qt.padEnd(16)}  (${count} docs)${flag}`);
  }
  console.log();

  if (DRY_RUN) {
    console.log(`  Would update ${missing} documents.\n`);
    console.log(`  Re-run with --write to apply.\n`);
    await mongoose.disconnect();
    return;
  }

  // 2. Apply in batches keyed by roundType to keep updateMany calls minimal
  let totalUpdated = 0;
  const roundTypes = byRoundType.map((r: { _id: string | null }) => r._id as string | null);

  for (const rt of roundTypes) {
    const qt = rt ? (ROUND_TO_QTYPE[rt] ?? FALLBACK) : FALLBACK;
    const filter = rt
      ? { questionType: { $exists: false }, roundType: rt }
      : { questionType: { $exists: false }, roundType: { $in: [null, undefined] } };

    const result = await Question.updateMany(filter, { $set: { questionType: qt } });
    console.log(
      `  [set] ${rt ?? '(null)'} → ${qt}  (${result.modifiedCount} docs modified)`
    );
    totalUpdated += result.modifiedCount;
  }

  console.log(`\n${'═'.repeat(W)}`);
  console.log(`  Total modified: ${totalUpdated} / ${missing} expected`);
  if (totalUpdated !== missing) {
    console.log(`  ⚠  Count mismatch — re-run dry-run to inspect remaining.`);
  } else {
    console.log(`  ✓  All missing questionType fields populated.`);
  }
  console.log(`${'═'.repeat(W)}\n`);

  await mongoose.disconnect();
}

main().catch(async err => {
  console.error('\n[fatal]', err);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
