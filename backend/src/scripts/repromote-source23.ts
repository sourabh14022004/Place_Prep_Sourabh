/**
 * Deletes all existing sourceId:23 records from MongoDB and re-promotes the
 * corrected 1,773-record parse from data/staging/parsed/23.json.
 *
 * Phase 7 rule: verified:false on every promoted record — no exceptions.
 * Dedup logic: unchanged from promote-to-mongo.ts (problemSummary-based).
 *
 * Usage:
 *   ts-node -P tsconfig.json src/scripts/repromote-source23.ts            # dry-run
 *   ts-node -P tsconfig.json src/scripts/repromote-source23.ts --write    # live
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../config/db';

const DRY_RUN  = !process.argv.includes('--write');
const JSON_PATH = path.resolve(__dirname, '../../../data/staging/parsed/23.json');
const SOURCE_ID = 23;

async function main() {
  console.log(`\n  repromote-source23  [${DRY_RUN ? 'DRY-RUN' : 'WRITE  '}]\n`);
  await connectDB();
  const col = mongoose.connection.collection('questions');

  // ── Before counts ──────────────────────────────────────────────────────────
  const beforeTotal   = await col.countDocuments({});
  const beforeSource23 = await col.countDocuments({ sourceId: SOURCE_ID });
  console.log(`  Before — total questions:    ${beforeTotal}`);
  console.log(`  Before — sourceId:23 count:  ${beforeSource23}`);

  // ── Load new records ───────────────────────────────────────────────────────
  const newRecords: any[] = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  console.log(`\n  New JSON record count:       ${newRecords.length}`);

  // Verify Phase 7: all records must have verified:false
  const badVerified = newRecords.filter(r => r.verified === true);
  if (badVerified.length > 0) {
    console.error(`  FATAL: ${badVerified.length} records have verified:true — aborting.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log('  Phase 7 check: all records have verified:false ✓');

  // Sanity: confirm all records are sourceId:23
  const wrongSource = newRecords.filter(r => r.sourceId !== SOURCE_ID);
  if (wrongSource.length > 0) {
    console.error(`  FATAL: ${wrongSource.length} records have sourceId !== 23 — aborting.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (DRY_RUN) {
    // Show sample of open-ended and MCQ records
    const openEnded = newRecords.filter(r => !r.isMcq);
    const mcqRecs   = newRecords.filter(r =>  r.isMcq);
    console.log(`\n  open-ended (isMcq:false): ${openEnded.length}`);
    console.log(`  MCQ        (isMcq:true):  ${mcqRecs.length}`);

    console.log('\n  Dry-run — no MongoDB changes. Pass --write to apply.\n');
    await mongoose.disconnect();
    return;
  }

  // ── Delete existing sourceId:23 records ────────────────────────────────────
  console.log(`\n  Deleting ${beforeSource23} existing sourceId:23 records...`);
  const deleteResult = await col.deleteMany({ sourceId: SOURCE_ID });
  console.log(`  Deleted: ${deleteResult.deletedCount}`);

  // Verify no other sourceId was touched
  const afterDelete = await col.countDocuments({});
  const deletedTotal = beforeTotal - afterDelete;
  if (deletedTotal !== beforeSource23) {
    console.error(`  FATAL: deleted ${deletedTotal} but expected ${beforeSource23} — mismatch!`);
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`  Total before delete: ${beforeTotal}, after delete: ${afterDelete} (diff: ${deletedTotal}) ✓`);

  // ── Promote new records ────────────────────────────────────────────────────
  console.log(`\n  Promoting ${newRecords.length} corrected records...`);

  let inserted = 0;
  let deduped  = 0;

  for (const r of newRecords) {
    // Dedup: skip if a record with same problemSummary already exists
    // (This handles any cross-batch duplicates — same logic as promote-to-mongo.ts)
    const exists = await col.findOne(
      { problemSummary: r.problemSummary },
      { projection: { _id: 1 } }
    );
    if (exists) { deduped++; continue; }

    await col.insertOne({
      ...r,
      verified: false,   // Phase 7 rule — explicit, never overridden
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    inserted++;
  }

  console.log(`  Inserted: ${inserted}  |  Deduped (already existed): ${deduped}`);

  // ── After counts ──────────────────────────────────────────────────────────
  const afterTotal    = await col.countDocuments({});
  const afterSource23 = await col.countDocuments({ sourceId: SOURCE_ID });
  const otherSourcesBefore = beforeTotal - beforeSource23;
  const otherSourcesAfter  = afterTotal  - afterSource23;

  console.log(`\n  After — total questions:     ${afterTotal}`);
  console.log(`  After — sourceId:23 count:   ${afterSource23}`);
  console.log(`  Other sourceIds before:       ${otherSourcesBefore}`);
  console.log(`  Other sourceIds after:        ${otherSourcesAfter}`);

  if (otherSourcesBefore !== otherSourcesAfter) {
    console.error('\n  ⚠  WARNING: non-source-23 counts changed — investigate!');
  } else {
    console.log('  Non-sourceId:23 records unchanged ✓');
  }

  // isMcq breakdown
  const mcqCount  = await col.countDocuments({ sourceId: SOURCE_ID, isMcq: true });
  const openCount = await col.countDocuments({ sourceId: SOURCE_ID, isMcq: false });
  console.log(`\n  sourceId:23 isMcq:true:   ${mcqCount}`);
  console.log(`  sourceId:23 isMcq:false:  ${openCount}`);
  console.log('\n  Done.\n');

  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
