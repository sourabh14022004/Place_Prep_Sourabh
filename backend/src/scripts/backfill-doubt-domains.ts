/**
 * backfill-doubt-domains.ts
 *
 * Assigns FacultyProfile.doubtDomains for faculty created before doubt routing
 * existed. Without domains a faculty member sees an empty doubt inbox, so this
 * seeds a sensible default from their existing `subject` field. The admin can
 * change any of it afterwards in Manage Faculty — this only fills the blank.
 *
 * Dry-run by default. Pass --write to persist.
 *
 *   npx ts-node src/scripts/backfill-doubt-domains.ts
 *   npx ts-node src/scripts/backfill-doubt-domains.ts --write
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import FacultyProfile from '../models/FacultyProfile';
import { DOUBT_DOMAINS, type DoubtTag as DoubtDomain } from '../types/shared.types';

const WRITE = process.argv.includes('--write');

// Longest/most specific patterns first — 'design' alone would swallow both
// 'system design' and 'low level design'.
//
// Subjects with no honest mapping (ML, data science, domain electives) fall
// through to 'General' on purpose. Guessing a domain for them would silently
// route real student doubts to someone who doesn't teach the topic — the admin
// can assign them properly in Manage Faculty.
const SUBJECT_PATTERNS: Array<[RegExp, DoubtDomain]> = [
  [/low\s*level\s*design|\blld\b|object.oriented|\boop\b/i, 'LLD'],
  [/system\s*design|\bhld\b|high\s*level|distributed|scalab/i, 'System Design'],
  [/data\s*structure|algorithm|\bdsa\b|dynamic\s*programming|competitive/i, 'DSA'],
  [/web|frontend|front.end|backend|back.end|react|node|full\s*stack|api/i, 'Web Development'],
  [/aptitude|reasoning|quant|logical|\bmath/i, 'Aptitude'],
  [/\bhr\b|behaviou?ral|interview\s*prep|soft\s*skill|communicat|resume/i, 'HR'],
  // CS fundamentals: closest of the seven, though not a perfect fit.
  [/database|\bdbms\b|\bsql\b|operating\s*system|\bos\b|network/i, 'System Design'],
];

function inferDomains(subject: string | undefined, stream: string | undefined): DoubtDomain[] {
  const haystack = `${subject ?? ''} ${stream ?? ''}`.trim();
  if (!haystack) return ['General'];
  for (const [pattern, domain] of SUBJECT_PATTERNS) {
    if (pattern.test(haystack)) return [domain];
  }
  return ['General'];
}

async function main() {
  await connectDB();
  // Via the model, so a collection rename in the schema can't silently make
  // this script scan an empty collection and report "nothing to do".
  const col = FacultyProfile.collection;

  const total = await col.countDocuments({});
  const needsBackfill = await col
    .find({ $or: [{ doubtDomains: { $exists: false } }, { doubtDomains: { $size: 0 } }] })
    .toArray();

  console.log(`\nmode:                     ${WRITE ? 'WRITE' : 'DRY RUN (no changes)'}`);
  console.log(`faculty profiles total:   ${total}`);
  console.log(`already have domains:     ${total - needsBackfill.length}`);
  console.log(`need backfill:            ${needsBackfill.length}\n`);

  if (needsBackfill.length === 0) {
    console.log('Nothing to do.\n');
    await mongoose.disconnect();
    return;
  }

  const planned = needsBackfill.map(doc => ({
    _id: doc._id,
    name: (doc.fullName as string) ?? '(unnamed)',
    subject: (doc.subject as string) ?? '(none)',
    domains: inferDomains(doc.subject as string, doc.stream as string),
  }));

  console.log('Planned assignments:');
  for (const p of planned) {
    console.log(`  ${p.name.padEnd(24)} ${p.subject.padEnd(30)} -> ${p.domains.join(', ')}`);
  }

  // Post-backfill coverage. A domain with zero faculty makes every doubt in it
  // fall back to notifying nobody in particular, so surface that now.
  const coverage = new Map<DoubtDomain, number>(DOUBT_DOMAINS.map(d => [d, 0]));
  const existing = await col
    .find({ doubtDomains: { $exists: true, $not: { $size: 0 } } })
    .project({ doubtDomains: 1 })
    .toArray();
  for (const doc of [...existing.map(d => ({ domains: d.doubtDomains as DoubtDomain[] })), ...planned]) {
    for (const d of doc.domains ?? []) {
      if (coverage.has(d)) coverage.set(d, (coverage.get(d) ?? 0) + 1);
    }
  }

  console.log('\nCoverage after backfill:');
  for (const domain of DOUBT_DOMAINS) {
    const n = coverage.get(domain) ?? 0;
    console.log(`  ${domain.padEnd(18)} ${String(n).padStart(3)} faculty${n === 0 ? '   <-- UNCOVERED' : ''}`);
  }

  if (!WRITE) {
    console.log('\nDry run only. Re-run with --write to apply.\n');
    await mongoose.disconnect();
    return;
  }

  const ops = planned.map(p => ({
    updateOne: { filter: { _id: p._id }, update: { $set: { doubtDomains: p.domains } } },
  }));
  const result = await col.bulkWrite(ops);
  console.log(`\nUpdated ${result.modifiedCount} faculty profile(s).\n`);

  await mongoose.disconnect();
}

main().catch(async err => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
