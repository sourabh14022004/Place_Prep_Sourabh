import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

async function main() {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  // Get distinct source values for the 1,756 no-options aptitude_mcq records
  const sources = await col.distinct('source', {
    questionType: 'aptitude_mcq',
    verified: true,
    'options.0': { $exists: false },
  });

  console.log(`\n── Distinct source values (${sources.length} unique) ──`);
  sources.forEach((s: any) => console.log(`  "${s}"`));

  // Show exact counts per source
  console.log('\n── Count per source ──');
  for (const src of sources) {
    const n = await col.countDocuments({
      questionType: 'aptitude_mcq',
      verified: true,
      'options.0': { $exists: false },
      source: src,
    });
    console.log(`  ${n.toString().padStart(5)}  "${src}"`);
  }

  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
