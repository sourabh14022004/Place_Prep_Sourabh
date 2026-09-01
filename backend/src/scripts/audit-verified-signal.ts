import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

async function main() {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  const [
    total,
    verifiedTrue, verifiedFalse, verifiedMissing,
    isSeededTrue, isSeededMissing,
    sourceIdExists,
    notSeededVerifiedFalse,
    notSeededVerifiedMissing,
    sourceIdNotExistsVerifiedFalse,
  ] = await Promise.all([
    col.countDocuments({}),
    col.countDocuments({ verified: true }),
    col.countDocuments({ verified: false }),
    col.countDocuments({ verified: { $exists: false } }),
    col.countDocuments({ isSeeded: true }),
    col.countDocuments({ isSeeded: { $exists: false } }),
    col.countDocuments({ sourceId: { $exists: true } }),
    col.countDocuments({ isSeeded: { $ne: true }, verified: false }),
    col.countDocuments({ isSeeded: { $ne: true }, verified: { $exists: false } }),
    col.countDocuments({ sourceId: { $exists: false }, verified: false }),
  ]);

  console.log(`total:                               ${total}`);
  console.log(`verified: true                       ${verifiedTrue}`);
  console.log(`verified: false                      ${verifiedFalse}`);
  console.log(`verified: missing (field absent)     ${verifiedMissing}`);
  console.log(`isSeeded: true                       ${isSeededTrue}`);
  console.log(`isSeeded: missing                    ${isSeededMissing}`);
  console.log(`sourceId exists (Phase 7)            ${sourceIdExists}`);
  console.log(`NOT isSeeded + verified: false       ${notSeededVerifiedFalse}`);
  console.log(`NOT isSeeded + verified: missing     ${notSeededVerifiedMissing}`);
  console.log(`no sourceId + verified: false        ${sourceIdNotExistsVerifiedFalse}`);

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
