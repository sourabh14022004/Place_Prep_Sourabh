/**
 * backend/src/scripts/audit-backfill-scope.ts
 * READ-ONLY scope report for two proposed backfills. No writes, no --write flag.
 *
 * 1. targetRoles scope per roundType — verified questions where targetRoles is
 *    unset / empty / exactly the schema default ['SDE-1','SDE-2'], vs total.
 * 2. frequencyScore coverage — how many verified questions could actually derive
 *    a real score from Company.topicFrequency[] (bucket A), vs need a fallback
 *    (bucket B = real slug, no topic match) or have no signal (bucket C = null slug).
 * 3. The one-line roadmap.service.ts fix needed to make targetRoles actually
 *    filter roadmap questions once the backfill has run.
 *
 * Usage (from backend/):
 *   DOTENV_CONFIG_PATH=../dashboard/student-portal/.env.local \
 *     npx ts-node -r dotenv/config src/scripts/audit-backfill-scope.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

// Mirrors nameToSlug in backfill-role-topics.ts so question topic *names* normalize
// to the same slug shape stored in Company.topicFrequency[].topicSlug.
function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const DEFAULT_ROLES = ['SDE-1', 'SDE-2'];

async function main() {
  await connectDB();
  const questions = mongoose.connection.collection('questions');
  const companies = mongoose.connection.collection('companies');

  // ────────────────────────────────────────────────────────────────────────
  // 1. targetRoles scope per roundType  (scope query #1, verbatim)
  // ────────────────────────────────────────────────────────────────────────
  const needsBackfillRows = await questions.aggregate([
    { $match: { verified: true, $or: [
        { targetRoles: { $exists: false } },
        { targetRoles: { $size: 0 } },
        { targetRoles: DEFAULT_ROLES },
    ]}},
    { $group: { _id: '$roundType', needsBackfill: { $sum: 1 } } },
    { $sort: { needsBackfill: -1 } },
  ]).toArray();

  const totalRows = await questions.aggregate([
    { $match: { verified: true } },
    { $group: { _id: '$roundType', total: { $sum: 1 } } },
  ]).toArray();

  const totalByRound = new Map<string, number>(
    totalRows.map(r => [String(r._id ?? '(none)'), r.total as number])
  );
  const needsByRound = new Map<string, number>(
    needsBackfillRows.map(r => [String(r._id ?? '(none)'), r.needsBackfill as number])
  );

  // Union of roundTypes across both aggregations, ordered by needsBackfill desc.
  const roundKeys = Array.from(new Set([...totalByRound.keys(), ...needsByRound.keys()]))
    .sort((a, b) => (needsByRound.get(b) ?? 0) - (needsByRound.get(a) ?? 0));

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(' 1. targetRoles BACKFILL SCOPE (verified questions)');
  console.log('    "needs backfill" = unset | empty | exactly [SDE-1,SDE-2]');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`${'roundType'.padEnd(16)}${'needsBackfill'.padStart(14)}${'total'.padStart(10)}${'%'.padStart(8)}`);
  console.log('─'.repeat(48));

  let needsTotal = 0;
  let verifiedTotal = 0;
  for (const key of roundKeys) {
    const need = needsByRound.get(key) ?? 0;
    const tot = totalByRound.get(key) ?? 0;
    needsTotal += need;
    verifiedTotal += tot;
    const pct = tot > 0 ? ((need / tot) * 100).toFixed(1) : '—';
    console.log(`${key.padEnd(16)}${String(need).padStart(14)}${String(tot).padStart(10)}${pct.padStart(8)}`);
  }
  console.log('─'.repeat(48));
  const totalPct = verifiedTotal > 0 ? ((needsTotal / verifiedTotal) * 100).toFixed(1) : '—';
  console.log(`${'TOTAL'.padEnd(16)}${String(needsTotal).padStart(14)}${String(verifiedTotal).padStart(10)}${totalPct.padStart(8)}`);
  console.log('\n  NOTE: the exact-array match [SDE-1,SDE-2] cannot distinguish the');
  console.log('  never-touched schema default from an intentional SDE-1+SDE-2 tag.');
  console.log('  Harmless today (role tagging never ran); over-reports once it does.');

  // ────────────────────────────────────────────────────────────────────────
  // 2. frequencyScore coverage  (in-memory join, scale-corrected /100)
  // ────────────────────────────────────────────────────────────────────────
  // Company slug → (topicSlug → frequencyPct). Used to test topic membership and
  // to compute the scale-corrected derived score (frequencyPct / 100 ∈ [0,1]).
  const slugTopicPct = new Map<string, Map<string, number>>();
  const compCursor = companies.find(
    {},
    { projection: { slug: 1, topicFrequency: 1 } }
  );
  for await (const c of compCursor) {
    const slug = String(c.slug ?? '').toLowerCase();
    if (!slug) continue;
    const topicMap = new Map<string, number>();
    for (const t of (c.topicFrequency ?? []) as Array<{ topicSlug?: string; frequencyPct?: number }>) {
      if (t.topicSlug) topicMap.set(t.topicSlug, Number(t.frequencyPct ?? 0));
    }
    slugTopicPct.set(slug, topicMap);
  }

  let vTotal = 0;      // total verified
  let realSlug = 0;    // companySlug present & non-empty
  let bucketA = 0;     // real slug + ≥1 topic matches company topicFrequency[]
  let bucketB = 0;     // real slug, no topic match (incl. no topics / company missing)
  let bucketC = 0;     // companySlug null / missing / empty

  // Sanity check on the scale correction: distribution of derived scores for A.
  let derivedMin = Infinity, derivedMax = -Infinity, derivedSum = 0;

  const qCursor = questions.find(
    { verified: true },
    { projection: { companySlug: 1, topics: 1 } }
  );
  for await (const q of qCursor) {
    vTotal++;
    const slug = q.companySlug ? String(q.companySlug).toLowerCase() : '';
    if (!slug) { bucketC++; continue; }
    realSlug++;

    const topicMap = slugTopicPct.get(slug);
    const topics: string[] = Array.isArray(q.topics) ? q.topics : [];

    let bestPct = -1;
    if (topicMap) {
      for (const name of topics) {
        const pct = topicMap.get(nameToSlug(name));
        if (pct !== undefined && pct > bestPct) bestPct = pct;
      }
    }

    if (bestPct >= 0) {
      bucketA++;
      const derived = bestPct / 100; // scale correction: frequencyPct 0–100 → score 0–1
      if (derived < derivedMin) derivedMin = derived;
      if (derived > derivedMax) derivedMax = derived;
      derivedSum += derived;
    } else {
      bucketB++;
    }
  }

  const pctOf = (n: number) => vTotal > 0 ? ((n / vTotal) * 100).toFixed(1) + '%' : '—';

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(' 2. frequencyScore BACKFILL COVERAGE (verified questions)');
  console.log('    derived from Company.topicFrequency[].frequencyPct / 100');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  total verified                         ${String(vTotal).padStart(7)}`);
  console.log(`  real companySlug (non-null)            ${String(realSlug).padStart(7)}  ${pctOf(realSlug)}`);
  console.log(`  ├─ bucket A  topic match → real score  ${String(bucketA).padStart(7)}  ${pctOf(bucketA)}`);
  console.log(`  └─ bucket B  slug, no topic match      ${String(bucketB).padStart(7)}  ${pctOf(bucketB)}`);
  console.log(`  bucket C  companySlug null → no signal  ${String(bucketC).padStart(7)}  ${pctOf(bucketC)}`);
  console.log('─'.repeat(48));
  if (bucketA > 0) {
    const avg = derivedSum / bucketA;
    console.log(`  bucket A derived score (frequencyPct/100): ` +
      `min ${derivedMin.toFixed(3)}  max ${derivedMax.toFixed(3)}  avg ${avg.toFixed(3)}`);
    console.log(`  (confirms scale correction lands inside the schema's [0,1] range)`);
  }
  console.log(`  bucket B + C need a fallback (leave 0, or topic-avg proxy flagged`);
  console.log(`  as approximation). A = the fraction that gets a real company signal.`);

  // ────────────────────────────────────────────────────────────────────────
  // 3. One-line roadmap.service.ts fix to make targetRoles actually filter
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(' 3. roadmap.service.ts — make targetRoles filter roadmap questions');
  console.log('    (targetRole is already destructured; findMany just never gets it)');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  CURRENT (buildWeeks, ~line 83):');
  console.log('        const { questions } = await questionRepository.findMany({');
  console.log('          companySlug,');
  console.log('          topic: topicName,');
  console.log('          limit: questionsPerWeek,');
  console.log('        });');
  console.log('');
  console.log('  SHOULD BECOME:');
  console.log('        const { questions } = await questionRepository.findMany({');
  console.log('          companySlug,');
  console.log('          topic: topicName,');
  console.log('          targetRole,        // ← apply role filter (needs targetRoles backfill first)');
  console.log('          limit: questionsPerWeek,');
  console.log('        });');
  console.log('\n  Apply only AFTER the targetRoles backfill — otherwise the default');
  console.log('  ["SDE-1","SDE-2"] tag hides every question from non-SDE roles.\n');

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
