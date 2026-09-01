/**
 * backend/src/scripts/backfill-mcq.ts
 *
 * One-shot data fix for MCQ visibility:
 *  1. Set isMcq: true wherever an options array exists but the flag is stale.
 *  2. Promote caution-source MCQs to verified ONLY after structural validation:
 *     every promoted doc must have >= 2 options and exactly one correct answer,
 *     plus a non-empty explanation. Anything failing stays untouched.
 *
 * Run: npm run backfill:mcq        (dry-run by default shows what would change)
 *      npm run backfill:mcq -- --write
 */

import mongoose from 'mongoose';
import Question from '../models/Question';
import 'dotenv/config';



const DRY = !process.argv.includes('--write');

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected.${DRY ? ' (DRY RUN — pass --write to apply)' : ''}`);

  // ── Step 0: structural validation of option-bearing docs ──
  const candidates = await Question.find({
    options: { $exists: true },
    $expr: { $gt: [{ $size: { $ifNull: ['$options', []] } }, 0] },
    isDuplicate: { $ne: true },
  }).lean();
  console.log(`Option-bearing docs found: ${candidates.length}`);

  let validStructure = 0;
  let invalidStructure = 0;
  const promotableIds: mongoose.Types.ObjectId[] = [];

  for (const q of candidates) {
    const opts = (q.options ?? []) as { label?: string; text?: string; isCorrect?: boolean }[];
    const hasText = opts.every((o) => typeof o.text === 'string' && o.text.trim().length > 0);
    const correctCount = opts.filter((o) => o.isCorrect === true).length;
    const ok = opts.length >= 2 && hasText && correctCount === 1 && !!q.explanation;

    if (!q.isMcq) {
      // stale flag fix — safe regardless of promotion
      if (!DRY) await Question.updateOne({ _id: q._id }, { $set: { isMcq: true } });
    }

    if (ok) {
      validStructure += 1;
      if (q.verified !== true) promotableIds.push(q._id);
    } else {
      invalidStructure += 1;
    }
  }
  console.log(`Structurally valid interactive MCQs: ${validStructure}`);
  console.log(`Invalid/ambiguous (skipped): ${invalidStructure}`);
  console.log(`Currently UNVERIFIED but valid → promoting: ${promotableIds.length}`);

  if (!DRY && promotableIds.length > 0) {
    const res = await Question.updateMany(
      { _id: { $in: promotableIds } },
      { $set: { verified: true, mcqPromotedAt: new Date() }, $unset: { cautionSource: '' } }
    );
    console.log(`Promoted ${res.modifiedCount} docs to verified.`);
  }

  // ── Summary after ──
  const summary = await Question.aggregate([
    { $match: { isDuplicate: { $ne: true }, verified: true } },
    { $group: {
        _id: '$questionType',
        total: { $sum: 1 },
        interactive: { $sum: { $cond: [{ $eq: ['$isMcq', true] }, 1, 0] } },
      } },
    { $sort: { total: -1 } },
  ]);
  console.table(summary.map((r) => ({ type: r._id ?? 'null', total: r.total, interactiveMCQ: r.interactive })));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
