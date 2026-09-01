/**
 * derive-round-percentages.ts
 *
 * Derives roundStructure[].percentage for qualifying companies by counting
 * how many verified questions fall into each roundType.
 *
 * Qualification gate: ≥ 2 distinct roundTypes each with ≥ 10 verified questions.
 * Non-qualifying companies are left completely untouched.
 *
 * Rounding: each roundType gets Math.round(count/total * 100). Any residual
 * from rounding is added to / subtracted from the largest bucket so the set
 * sums to exactly 100.
 *
 * Usage:
 *   ts-node ... src/scripts/derive-round-percentages.ts          # dry-run
 *   ts-node ... src/scripts/derive-round-percentages.ts --write  # persist
 */

import 'dotenv/config';
import connectDB from '../config/db';
import Company from '../models/Company';
import Question from '../models/Question';
import mongoose from 'mongoose';

const WRITE = process.argv.includes('--write');
const MIN_Q_PER_ROUND = 10;
const MIN_QUALIFYING_ROUNDS = 2;

function applyResidualsToLargest(
  entries: Array<{ roundType: string; count: number; pct: number }>
): Array<{ roundType: string; count: number; pct: number }> {
  const sum = entries.reduce((s, e) => s + e.pct, 0);
  const residual = 100 - sum;
  if (residual === 0) return entries;

  // Find the entry with the highest count (most questions → absorbs rounding error)
  const maxIdx = entries.reduce(
    (best, e, i) => (e.count > entries[best].count ? i : best),
    0
  );
  return entries.map((e, i) =>
    i === maxIdx ? { ...e, pct: e.pct + residual } : e
  );
}

async function main() {
  await connectDB();

  // Aggregate per-company, per-roundType question counts
  const breakdown = await Question.aggregate([
    { $match: { verified: true, companySlug: { $ne: null } } },
    {
      $group: {
        _id: { companySlug: '$companySlug', roundType: '$roundType' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.companySlug',
        rounds: { $push: { roundType: '$_id.roundType', count: '$count' } },
        totalQ: { $sum: '$count' },
      },
    },
  ]);

  const qualifying: Array<{
    slug: string;
    totalQ: number;
    entries: Array<{ roundType: string; count: number; pct: number }>;
  }> = [];

  for (const co of breakdown) {
    const qualRounds = (co.rounds as Array<{ roundType: string; count: number }>)
      .filter(r => r.count >= MIN_Q_PER_ROUND);
    if (qualRounds.length < MIN_QUALIFYING_ROUNDS) continue;

    const rawEntries = qualRounds.map(r => ({
      roundType: r.roundType,
      count: r.count,
      pct: Math.round((r.count / co.totalQ) * 100),
    }));

    const corrected = applyResidualsToLargest(rawEntries);
    qualifying.push({ slug: co._id, totalQ: co.totalQ, entries: corrected });
  }

  qualifying.sort((a, b) => b.totalQ - a.totalQ);

  console.log(`\n${WRITE ? '=== WRITE MODE ===' : '=== DRY-RUN (no changes written) ==='}`);
  console.log(`Qualifying companies: ${qualifying.length}\n`);

  for (const co of qualifying) {
    const sum = co.entries.reduce((s, e) => s + e.pct, 0);
    const detail = co.entries
      .sort((a, b) => b.count - a.count)
      .map(e => `${e.roundType}=${e.pct}% (${e.count}q)`)
      .join('  ');
    console.log(
      `  ${co.slug.padEnd(16)} total=${String(co.totalQ).padStart(5)}  sum=${sum}  [${detail}]`
    );

    if (WRITE) {
      // Fetch the company's current roundStructure
      const company = await Company.findOne({ slug: co.slug })
        .select('roundStructure')
        .lean() as any;

      if (!company) {
        console.log(`    SKIP: company doc not found`);
        continue;
      }

      // Build updated roundStructure: set percentage where we have derived data,
      // leave percentage absent on round types below the threshold
      const updatedRoundStructure = (company.roundStructure as any[]).map((r: any) => {
        const derived = co.entries.find(e => e.roundType === r.roundType);
        return derived
          ? { ...r, percentage: derived.pct }
          : { ...r, percentage: undefined };
      });

      await Company.updateOne(
        { slug: co.slug },
        { $set: { roundStructure: updatedRoundStructure } }
      );
      console.log(`    written`);
    }
  }

  if (!WRITE) {
    console.log('\nRe-run with --write to persist these values.');
  } else {
    console.log(`\n${qualifying.length} companies updated.`);
  }

  await mongoose.disconnect();
}

main().catch(async e => {
  console.error('\nERROR:', e.message);
  await mongoose.disconnect();
  process.exit(1);
});
