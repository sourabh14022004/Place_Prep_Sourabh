/**
 * Splits the 1,756 aptitude_mcq records (no options[]) into:
 *   Group A — have a non-empty leetcodeUrl  → confirmed coding problems, re-tag to dsa
 *   Group B — no leetcodeUrl                → unknown; show samples for manual review
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

// Records with no MCQ options (either field absent or empty array)
const BASE = { questionType: 'aptitude_mcq', verified: true, 'options.0': { $exists: false } };

async function main() {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  const total    = await col.countDocuments(BASE);
  const groupA   = await col.countDocuments({ ...BASE, leetcodeUrl: { $exists: true, $nin: [null, ''] } });
  const groupB   = total - groupA;

  console.log(`\n── aptitude_mcq with no options[] ──────────────────────────`);
  console.log(`  Total:                       ${total}`);
  console.log(`  Group A (has leetcodeUrl):   ${groupA}  → candidate for dsa re-tag`);
  console.log(`  Group B (no leetcodeUrl):    ${groupB}  → needs manual review`);

  // Group A samples
  const samplesA = await col.find(
    { ...BASE, leetcodeUrl: { $exists: true, $nin: [null, ''] } },
    { projection: { problemSummary: 1, leetcodeUrl: 1, roundType: 1, difficulty: 1, _id: 0 } }
  ).limit(3).toArray();

  console.log(`\n── Group A samples (leetcodeUrl present) ───────────────────`);
  (samplesA as any[]).forEach((r, i) =>
    console.log(`  ${i+1}. "${r.problemSummary}"  [${r.roundType} / ${r.difficulty}]\n     ${r.leetcodeUrl}`)
  );

  // Group B samples
  const samplesB = await col.find(
    { ...BASE, $or: [{ leetcodeUrl: { $exists: false } }, { leetcodeUrl: { $in: [null, ''] } }] },
    { projection: { problemSummary: 1, sourceUrl: 1, roundType: 1, difficulty: 1, source: 1, _id: 0 } }
  ).limit(8).toArray();

  console.log(`\n── Group B samples (no leetcodeUrl) ────────────────────────`);
  (samplesB as any[]).forEach((r, i) =>
    console.log(`  ${i+1}. "${r.problemSummary}"  [${r.roundType} / ${r.difficulty} / source=${r.source}]`)
  );

  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
