import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

async function main() {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  const total     = await col.countDocuments({ roundType: 'System Design' });
  const withLc    = await col.countDocuments({ roundType: 'System Design', leetcodeUrl: { $nin: [null, ''] } });
  const phase7    = await col.countDocuments({ roundType: 'System Design', sourceId: { $exists: true } });
  const prePhase1 = await col.countDocuments({ roundType: 'System Design', isSeeded: true });

  console.log(`total roundType:"System Design":    ${total}`);
  console.log(`  with leetcodeUrl non-empty:        ${withLc}`);
  console.log(`  Phase 7 (sourceId exists):         ${phase7}`);
  console.log(`  pre-Phase-1 (isSeeded:true):       ${prePhase1}`);

  const pre = await col.find(
    { roundType: 'System Design', isSeeded: true },
    { projection: { problemSummary: 1, leetcodeUrl: 1, _id: 0 } }
  ).limit(5).toArray();

  console.log('\nPre-Phase-1 System Design samples:');
  pre.forEach((s, i) => console.log(`  ${i + 1}. ${(s as any).problemSummary}  [leetcodeUrl=${(s as any).leetcodeUrl ?? 'null'}]`));

  await mongoose.disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
