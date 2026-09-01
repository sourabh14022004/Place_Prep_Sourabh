/**
 * Compares per-section record counts between:
 *   - MongoDB (current live sourceId:23 records, 1,773 expected)
 *   - New parsed JSON at data/staging/parsed/23.json (1,745 expected)
 *
 * Section is extracted from the 9th path segment of sourceUrl,
 * e.g. "01 Quantitative Aptitude (Numerical Ability)".
 *
 * Usage:
 *   ts-node -P tsconfig.json src/scripts/audit-source23-sections.ts
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../config/db';

function extractSection(sourceUrl: string | undefined): string {
  if (!sourceUrl) return '(no sourceUrl)';
  // URL form: .../blob/master/<section-folder>/...
  const parts = sourceUrl.split('/');
  const masterIdx = parts.indexOf('master');
  if (masterIdx !== -1 && masterIdx + 1 < parts.length) {
    return decodeURIComponent(parts[masterIdx + 1]);
  }
  return '(unknown)';
}

async function main() {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  // ── MongoDB: group by section ──────────────────────────────────────────────
  const mongoAgg = await col.aggregate([
    { $match: { sourceId: 23 } },
    { $group: { _id: '$sourceUrl', count: { $sum: 1 } } },
  ]).toArray() as { _id: string; count: number }[];

  const mongoBySection: Record<string, number> = {};
  let mongoTotal = 0;
  for (const row of mongoAgg) {
    const section = extractSection(row._id);
    mongoBySection[section] = (mongoBySection[section] ?? 0) + row.count;
    mongoTotal += row.count;
  }

  // ── New JSON: group by section ─────────────────────────────────────────────
  const jsonPath = path.resolve(__dirname, '../../../data/staging/parsed/23.json');
  const newRecords: any[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const jsonBySection: Record<string, number> = {};
  const jsonMcqBySection: Record<string, number> = {};
  let jsonTotal = 0;
  for (const r of newRecords) {
    const section = extractSection(r.sourceUrl);
    jsonBySection[section] = (jsonBySection[section] ?? 0) + 1;
    if (r.isMcq) jsonMcqBySection[section] = (jsonMcqBySection[section] ?? 0) + 1;
    jsonTotal++;
  }

  // ── Print comparison table ─────────────────────────────────────────────────
  const allSections = [...new Set([...Object.keys(mongoBySection), ...Object.keys(jsonBySection)])].sort();

  const COL = 44;
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  Source 23 — section-level count comparison`);
  console.log(`${'═'.repeat(80)}`);
  console.log(
    `  ${'Section'.padEnd(COL)}  ${'MongoDB'.padStart(8)}  ${'NewJSON'.padStart(8)}  ${'Δ'.padStart(6)}  MCQ`
  );
  console.log(`  ${'─'.repeat(78)}`);

  for (const sec of allSections) {
    const mongo = mongoBySection[sec] ?? 0;
    const json  = jsonBySection[sec]  ?? 0;
    const delta = json - mongo;
    const mcq   = jsonMcqBySection[sec] ?? 0;
    const flag  = delta < -5 ? ' ◄ LOSS' : delta > 5 ? ' ◄ GAIN' : '';
    console.log(
      `  ${sec.slice(0, COL).padEnd(COL)}  ${String(mongo).padStart(8)}  ${String(json).padStart(8)}  ${((delta >= 0 ? '+' : '') + String(delta)).padStart(6)}  ${mcq > 0 ? mcq + ' MCQ' : ''}${flag}`
    );
  }

  console.log(`  ${'─'.repeat(78)}`);
  const totalDelta = jsonTotal - mongoTotal;
  console.log(
    `  ${'TOTAL'.padEnd(COL)}  ${String(mongoTotal).padStart(8)}  ${String(jsonTotal).padStart(8)}  ${((totalDelta >= 0 ? '+' : '') + String(totalDelta)).padStart(6)}`
  );
  console.log(`${'═'.repeat(80)}`);
  console.log(`\n  Gap of ${Math.abs(totalDelta)} records — check if Δ is spread across sections (dedup) or concentrated (bug)\n`);

  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
