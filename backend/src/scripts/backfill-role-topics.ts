/**
 * backend/src/scripts/backfill-role-topics.ts
 * Populate Company.roleTopicFrequency[] from existing Question data.
 *
 * Role derivation (two-tier):
 *   Tier 1: use Question.targetRoles[] when non-empty (curated data)
 *   Tier 2: derive roles from Question.roundType when targetRoles is empty
 *           (mapping mirrors the migration comment in Question.ts)
 *
 * Usage (from repo root):
 *   MONGODB_URI=<uri> npx ts-node -P backend/tsconfig.json backend/src/scripts/backfill-role-topics.ts
 *   MONGODB_URI=<uri> npx ts-node -P backend/tsconfig.json backend/src/scripts/backfill-role-topics.ts --write
 *
 * Default is dry-run. Pass --write to apply changes.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import Company from '../models/Company';
import Question from '../models/Question';
import { TARGET_ROLES } from '../constants/roles';

const DRY_RUN = !process.argv.includes('--write');

// Tier-2 fallback: roundType → roles when Question.targetRoles is empty.
// Mirrors the mapping comment in Question.ts.
const ROUND_TYPE_ROLES: Record<string, readonly string[]> = {
  'Coding':        ['SDE-1', 'SDE-2', 'SDE-3', 'ML Engineer'],
  'System Design': ['SDE-2', 'SDE-3', 'ML Engineer'],
  'LLD':           ['SDE-1', 'SDE-2', 'SDE-3'],
  'HR':            TARGET_ROLES,
  'Aptitude':      ['SDE-1', 'SDE-2', 'SDE-3', 'Data Analyst'],
  'Domain':        ['Data Analyst', 'Product Manager'],
};

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function resolveRoles(q: any): string[] {
  const explicit: string[] = q.targetRoles ?? [];
  if (explicit.length > 0) return explicit;
  const mapped = ROUND_TYPE_ROLES[q.roundType ?? ''] ?? [];
  return [...mapped];
}

async function main() {
  await connectDB();
  console.log(`\nbackfill-role-topics [${DRY_RUN ? 'DRY RUN — no writes' : 'WRITE MODE'}]\n`);

  const companies = await Company.find({}).select('_id name slug').lean();
  console.log(`Found ${companies.length} companies.\n`);

  let updated = 0;
  let skipped = 0;

  for (const company of companies) {
    const questions = await Question.find({ companySlug: company.slug })
      .select('topics roundType targetRoles')
      .lean();

    if (questions.length === 0) {
      console.log(`  SKIP  ${company.name} — no questions`);
      skipped++;
      continue;
    }

    // role → topicSlug → { count, roundTypes, topicName }
    const roleTopicMap = new Map<string, Map<string, { count: number; roundTypes: string[]; topicName: string }>>();

    let tier1Count = 0;
    let tier2Count = 0;

    for (const q of questions) {
      const roles = resolveRoles(q);
      const qTopics: string[] = (q as any).topics ?? [];
      const roundType: string = (q as any).roundType ?? 'Coding';

      if ((q as any).targetRoles?.length > 0) tier1Count++;
      else tier2Count++;

      for (const role of roles) {
        if (!roleTopicMap.has(role)) roleTopicMap.set(role, new Map());
        const topicMap = roleTopicMap.get(role)!;

        for (const topicName of qTopics) {
          const slug = nameToSlug(topicName);
          if (!topicMap.has(slug)) {
            topicMap.set(slug, { count: 0, roundTypes: [], topicName });
          }
          const entry = topicMap.get(slug)!;
          entry.count++;
          if (!entry.roundTypes.includes(roundType)) entry.roundTypes.push(roundType);
        }
      }
    }

    const roleTopicFrequency = Array.from(roleTopicMap.entries()).map(([roleName, topicMap]) => {
      const roleTotal = Array.from(topicMap.values()).reduce((s, e) => s + e.count, 0);
      const topics = Array.from(topicMap.entries())
        .map(([topicSlug, entry]) => ({
          topicSlug,
          topicName: entry.topicName,
          frequencyPct: Math.round((entry.count / roleTotal) * 1000) / 10, // 1 decimal place
          roundType: entry.roundTypes[0] ?? 'Coding',
          questionCount: entry.count,
        }))
        .sort((a, b) => b.frequencyPct - a.frequencyPct);

      return { roleName, topics };
    });

    const rolesSummary = roleTopicFrequency
      .map((r) => `${r.roleName}(${r.topics.length}t)`)
      .join(', ');

    console.log(
      `  ${DRY_RUN ? 'DRY' : 'WRITE'}  ${company.name.padEnd(20)} ` +
      `${questions.length}q [t1:${tier1Count} t2:${tier2Count}] → ${rolesSummary}`
    );

    if (!DRY_RUN) {
      await Company.updateOne(
        { _id: company._id },
        { $set: { roleTopicFrequency } }
      );
      updated++;
    }
  }

  console.log(`\n─────────────────────────────────────────`);
  if (DRY_RUN) {
    console.log(`Dry run complete. ${companies.length - skipped} companies would be updated.`);
    console.log(`Re-run with --write to apply.`);
  } else {
    console.log(`Done. Updated ${updated} companies, skipped ${skipped}.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
