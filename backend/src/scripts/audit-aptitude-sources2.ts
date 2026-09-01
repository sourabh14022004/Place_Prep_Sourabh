import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

async function main() {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  // Cross-check: total aptitude_mcq verified
  const totalApt = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true });

  // Count using each options-absence strategy
  const noOpt0   = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true, 'options.0': { $exists: false } });
  const emptyArr = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true, options: { $size: 0 } });
  const noField  = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true, options: { $exists: false } });
  const orBoth   = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true,
    $or: [{ options: { $exists: false } }, { options: { $size: 0 } }] });

  console.log(`\n── Filter cross-check ──`);
  console.log(`  total aptitude_mcq verified:          ${totalApt}`);
  console.log(`  options.0 $exists:false:              ${noOpt0}`);
  console.log(`  options $size:0 (empty array):        ${emptyArr}`);
  console.log(`  options $exists:false (field absent): ${noField}`);
  console.log(`  $or(absent | empty):                  ${orBoth}`);

  // Source breakdown via aggregation for ALL aptitude_mcq verified (no options filter)
  console.log(`\n── Source breakdown (aggregation, all aptitude_mcq verified) ──`);
  const bySource = await col.aggregate([
    { $match: { questionType: 'aptitude_mcq', verified: true } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  (bySource as any[]).forEach(r => console.log(`  ${String(r.count).padStart(5)}  "${r._id}"`));

  // Now with options absent
  console.log(`\n── Source breakdown (aggregation, no options field) ──`);
  const bySource2 = await col.aggregate([
    { $match: { questionType: 'aptitude_mcq', verified: true, options: { $exists: false } } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  (bySource2 as any[]).forEach(r => console.log(`  ${String(r.count).padStart(5)}  "${r._id}"`));

  // With empty array
  console.log(`\n── Source breakdown (aggregation, options: []) ──`);
  const bySource3 = await col.aggregate([
    { $match: { questionType: 'aptitude_mcq', verified: true, options: { $size: 0 } } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  (bySource3 as any[]).forEach(r => console.log(`  ${String(r.count).padStart(5)}  "${r._id}"`));

  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
