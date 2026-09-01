/**
 * scrapers/group-a/promote-to-mongo.ts
 *
 * Promotes staged records from data/staging/parsed/ into MongoDB.
 *
 * Dedup: character trigram Jaccard similarity (same algorithm as pg_trgm),
 * threshold 0.85, scoped per questionType.  Near-duplicates are inserted with
 * isDuplicate: true + canonicalId pointing to the first-accepted match, NOT
 * dropped — consistent with the audit-trail approach in the source PDF and the
 * isDuplicate: { $ne: true } filter already in question.repository.ts findMany().
 *
 * Every inserted document gets:
 *   verified: false          → invisible to students until admin approves
 *   companySlug / companyId  → NOT set (admin assigns these later)
 *
 * Usage (from repo root):
 *   ./backend/node_modules/.bin/ts-node -P scrapers/tsconfig.json \
 *     scrapers/group-a/promote-to-mongo.ts            ← dry-run (default)
 *
 *   ./backend/node_modules/.bin/ts-node -P scrapers/tsconfig.json \
 *     scrapers/group-a/promote-to-mongo.ts --write    ← real inserts
 *
 * If mongoose fails to resolve, prefix the command with:
 *   NODE_PATH=./backend/node_modules
 */

import * as path from 'path';
import * as fs   from 'fs';

// Load MONGODB_URI before connectDB() reads it.
// dotenv is a no-op when the var is already in the environment.
// connectDB() requires MONGODB_URI.  Parse env files manually (no dotenv dep needed)
// so this works from the scrapers/ context where backend/node_modules isn't on NODE_PATH.
// Variables already in the shell environment are never overwritten.
(function loadEnv(): void {
  const root = path.resolve(__dirname, '../..');
  const candidates = [
    path.join(root, 'backend', '.env.local'),
    path.join(root, 'backend', '.env'),
    path.join(root, 'dashboard', 'student-portal', '.env.local'),
    path.join(root, 'dashboard', 'admin-portal', '.env.local'),
    path.join(root, '.env.local'),
    path.join(root, '.env'),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    if (process.env.MONGODB_URI) break;
  }
})();

import mongoose from 'mongoose';
import connectDB from '../../backend/src/config/db';
import Question  from '../../backend/src/models/Question';

// ── Config ───────────────────────────────────────────────────────────────────

const DRY_RUN    = !process.argv.includes('--write');
const PARSED_DIR = path.resolve(__dirname, '../../data/staging/parsed');
const SOURCE_IDS = [9, 18, 20, 23] as const;
const BATCH_SIZE = 100;
const THRESHOLD  = 0.85;

// ── Trigram Jaccard (faithful JS equivalent of pg_trgm) ──────────────────────

function normalize(s: string): string {
  return s.toLowerCase()
          .replace(/[^a-z0-9 ]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
}

function tgrams(s: string): Set<string> {
  const out    = new Set<string>();
  const padded = `  ${s}  `;           // pg_trgm pads with two spaces on each side
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface StagedRecord {
  questionType?:   string;
  problemSummary?: string;
  cautionSource?:  boolean;
  [key: string]:   unknown;
}

interface RefEntry {
  id:     mongoose.Types.ObjectId;
  tgrams: Set<string>;
}

interface PreparedDoc {
  doc:        Record<string, unknown>;
  canonical:  boolean;
  matchedId:  mongoose.Types.ObjectId | null;
  sourceId:   number;
  qType:      string;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const W    = 80;
  const mode = DRY_RUN ? 'DRY-RUN' : 'WRITE  ';

  console.log(`\n${'═'.repeat(W)}`);
  console.log(`  PlacePrep — Group A promote-to-mongo                 [${mode}]`);
  console.log(`  Sources: 9 · 18 · 20 · 23   threshold: ${THRESHOLD} Jaccard`);
  console.log(`${'═'.repeat(W)}\n`);

  if (DRY_RUN) {
    console.log('  ℹ  Dry-run mode — MongoDB will be queried but nothing written.');
    console.log('     Re-run with --write to insert.\n');
  }

  // 1. Load staged JSON files ─────────────────────────────────────────────────
  const allRaw: (StagedRecord & { _sourceId: number })[] = [];
  for (const id of SOURCE_IDS) {
    const file = path.join(PARSED_DIR, `${id}.json`);
    if (!fs.existsSync(file)) {
      console.warn(`  [warn] data/staging/parsed/${id}.json not found — skipping`);
      continue;
    }
    const records = JSON.parse(fs.readFileSync(file, 'utf8')) as StagedRecord[];
    console.log(`  [load] source ${id}: ${records.length} records`);
    allRaw.push(...records.map(r => ({ ...r, _sourceId: id })));
  }
  const totalRead = allRaw.length;
  console.log(`\n  Total loaded: ${totalRead} records\n`);

  // 2. Connect ────────────────────────────────────────────────────────────────
  process.stdout.write('  [db]   connecting… ');
  await connectDB();
  console.log('connected\n');

  // 3. Idempotency warning ────────────────────────────────────────────────────
  const existingPromoted = await Question.countDocuments({
    sourceId: { $in: SOURCE_IDS as unknown as number[] },
  });
  if (existingPromoted > 0) {
    console.log(
      `  [warn] ${existingPromoted} record(s) from these sources already exist in MongoDB.`
    );
    console.log(
      `         Records matching existing ones (≥${THRESHOLD} Jaccard) will be inserted`
    );
    console.log(`         as isDuplicate=true — they will NOT appear in findMany() queries.\n`);
  }

  // 4. Group by questionType ──────────────────────────────────────────────────
  const byType = new Map<string, (StagedRecord & { _sourceId: number })[]>();
  for (const r of allRaw) {
    const t = r.questionType ?? 'unknown';
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(r);
  }

  // 5. Dedup pass per questionType ────────────────────────────────────────────
  const prepared: PreparedDoc[] = [];

  for (const [qType, records] of byType) {
    console.log(`  ── ${qType} (${records.length} staged)`);

    // Seed ref set from MongoDB existing records of this type
    const existingDocs = await Question.find(
      { questionType: qType },
      { _id: 1, problemSummary: 1 }
    ).lean();
    console.log(`     existing in DB: ${existingDocs.length}`);

    const refSet: RefEntry[] = existingDocs.map(e => ({
      id:     e._id as mongoose.Types.ObjectId,
      tgrams: tgrams(normalize((e.problemSummary as string | undefined) ?? '')),
    }));

    let nCanon = 0;
    let nDupe  = 0;

    for (const raw of records) {
      const { _sourceId, ...fields } = raw;
      const normText = normalize(raw.problemSummary ?? '');
      const tg       = tgrams(normText);

      // Find best Jaccard match in ref set
      let bestRef: RefEntry | null = null;
      let bestSim = 0;
      for (const ref of refSet) {
        const sim = jaccard(tg, ref.tgrams);
        if (sim >= THRESHOLD && sim > bestSim) {
          bestSim = sim;
          bestRef = ref;
        }
      }

      const newId = new mongoose.Types.ObjectId();

      if (bestRef !== null) {
        // Duplicate — insert tagged, canonicalId points to the matched record
        prepared.push({
          doc: {
            ...fields,
            _id:         newId,
            isDuplicate: true,
            isCanonical: false,
            canonicalId: bestRef.id,
            verified:    false,
            // companySlug / companyId intentionally absent
          },
          canonical: false,
          matchedId: bestRef.id,
          sourceId:  _sourceId,
          qType,
        });
        nDupe++;
      } else {
        // Canonical — add to ref set so intra-batch duplicates are caught too
        refSet.push({ id: newId, tgrams: tg });
        prepared.push({
          doc: {
            ...fields,
            _id:         newId,
            isDuplicate: false,
            isCanonical: true,
            verified:    false,
          },
          canonical: true,
          matchedId: null,
          sourceId:  _sourceId,
          qType,
        });
        nCanon++;
      }
    }

    console.log(`     canonical: ${nCanon}   inserted-as-duplicate: ${nDupe}\n`);
  }

  // 6. Insert (skipped in dry-run) ────────────────────────────────────────────
  const allDocs = prepared.map(p => p.doc);

  if (!DRY_RUN) {
    // Use the native collection driver to bypass Mongoose's required-field validation.
    // Scraped questions intentionally lack companyId/companySlug/companyName (required in
    // the schema for company-linked questions); those are assigned later by an admin.
    // The native driver still enforces _id uniqueness and uses the same MongoDB collection.
    console.log(`  [insert] ${allDocs.length} documents in batches of ${BATCH_SIZE}…`);
    let done = 0;
    for (let i = 0; i < allDocs.length; i += BATCH_SIZE) {
      const batch  = allDocs.slice(i, i + BATCH_SIZE);
      const result = await Question.collection.insertMany(batch, { ordered: false });
      done += result.insertedCount;
      process.stdout.write(`\r  [insert] ${done}/${allDocs.length}`);
    }
    console.log('\n');
  }

  // 7. Summary ────────────────────────────────────────────────────────────────
  const totalCanon  = prepared.filter(p => p.canonical).length;
  const totalDupe   = prepared.filter(p => !p.canonical).length;
  const totalCaution = allDocs.filter(d => d.cautionSource === true).length;

  // Per-type stats
  const typeStats = new Map<string, { canon: number; dupe: number; caution: number }>();
  for (const p of prepared) {
    if (!typeStats.has(p.qType)) typeStats.set(p.qType, { canon: 0, dupe: 0, caution: 0 });
    const s = typeStats.get(p.qType)!;
    if (p.canonical)              s.canon++;
    else                          s.dupe++;
    if (p.doc.cautionSource)      s.caution++;
  }

  const typeW = Math.max(...[...typeStats.keys()].map(k => k.length), 12);

  console.log(`${'═'.repeat(W)}`);
  console.log(`  GROUP A  ·  PROMOTE SUMMARY  ·  [${mode}]`);
  console.log(`${'═'.repeat(W)}`);
  console.log(`  Records read:               ${String(totalRead).padStart(6)}`);
  console.log(
    `  Inserted canonical:         ${String(totalCanon).padStart(6)}` +
    `   (isCanonical=true, verified=false)`
  );
  console.log(
    `  Inserted as duplicate:      ${String(totalDupe).padStart(6)}` +
    `   (isDuplicate=true, canonicalId set, verified=false)`
  );
  if (totalCaution > 0) {
    console.log(
      `  cautionSource=true (all canonical): ${String(totalCaution).padStart(6)}` +
      `   (GPL v3 — src 20; legal review before commercial launch)`
    );
  }

  console.log(`\n  By questionType:`);
  console.log(
    `  ${'type'.padEnd(typeW)}  ${'total'.padStart(6)}  ${'canonical'.padStart(10)}` +
    `  ${'as-duplicate'.padStart(12)}  caution`
  );
  console.log(`  ${'─'.repeat(W - 2)}`);

  for (const [t, s] of typeStats) {
    const total   = s.canon + s.dupe;
    const caution = s.caution > 0 ? String(s.caution).padStart(7) : '      —';
    console.log(
      `  ${t.padEnd(typeW)}  ${String(total).padStart(6)}  ${String(s.canon).padStart(10)}` +
      `  ${String(s.dupe).padStart(12)}  ${caution}`
    );
  }

  console.log(`  ${'─'.repeat(W - 2)}`);
  console.log(
    `  ${'TOTAL'.padEnd(typeW)}  ${String(totalRead).padStart(6)}  ${String(totalCanon).padStart(10)}` +
    `  ${String(totalDupe).padStart(12)}`
  );
  console.log(`${'═'.repeat(W)}`);

  if (DRY_RUN) {
    console.log('\n  No documents written. Re-run with --write to insert.\n');
  } else {
    console.log(
      '\n  Done. All records have verified=false.' +
      '\n  Approve via Admin portal → Question Bank.\n'
    );
  }

  await mongoose.disconnect();
}

main().catch(async err => {
  console.error('\n[fatal]', err);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
