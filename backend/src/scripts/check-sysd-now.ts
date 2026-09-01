import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

async function main() {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  const totalSysDesign = await col.countDocuments({ roundType: 'System Design' });
  const phase7SysDesign = await col.countDocuments({ roundType: 'System Design', sourceId: { $exists: true } });
  const seededSysDesign = await col.countDocuments({ roundType: 'System Design', isSeeded: true });

  console.log(`roundType:"System Design" total: ${totalSysDesign}`);
  console.log(`  Phase 7 (sourceId exists):     ${phase7SysDesign}`);
  console.log(`  pre-Phase-1 (isSeeded:true):   ${seededSysDesign}`);

  const samples = await col.find(
    { roundType: 'System Design', isSeeded: true },
    { projection: { problemSummary: 1, roundType: 1, questionType: 1, leetcodeUrl: 1, _id: 0 } }
  ).limit(10).toArray();

  console.log('\nPre-Phase-1 System Design records (current DB state):');
  (samples as any[]).forEach((s, i) =>
    console.log(`  ${i+1}. [questionType=${s.questionType ?? 'MISSING'}] "${s.problemSummary}"`)
  );

  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
