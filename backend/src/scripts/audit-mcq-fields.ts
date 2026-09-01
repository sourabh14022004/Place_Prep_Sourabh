import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';

async function main() {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  // Item 1: are the 5 "Minimized Maximum" records true duplicates?
  const minMax = await col.find(
    { roundType: 'Coding', isSeeded: true, problemSummary: /Minimized Maximum/i },
    { projection: { problemSummary: 1, roundType: 1, questionType: 1, difficulty: 1, topics: 1, companySlug: 1, sourceUrl: 1, _id: 1 } }
  ).toArray();

  console.log(`\n── Item 1: Post-fix state of "Minimized Maximum" records ──`);
  console.log(`  Count: ${minMax.length}`);
  const summaries = (minMax as any[]).map(r => r.problemSummary);
  const unique = new Set(summaries);
  console.log(`  Unique problemSummary values: ${unique.size}`);
  (minMax as any[]).forEach((r, i) => {
    console.log(`  ${i+1}. _id=${r._id}  slug=${r.companySlug}  diff=${r.difficulty}  topics=${JSON.stringify(r.topics)}  qtype=${r.questionType}`);
  });

  // Item 2: Sample aptitude_mcq documents — what fields are actually in MongoDB?
  console.log(`\n── Item 2: Raw aptitude_mcq document field presence ──`);

  const totalMcq = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true });
  const withIsMcqTrue = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true, isMcq: true });
  const withOptions = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true, 'options.0': { $exists: true } });
  const withExplanation = await col.countDocuments({ questionType: 'aptitude_mcq', verified: true, explanation: { $exists: true, $nin: [null, ''] } });

  console.log(`  total aptitude_mcq (verified): ${totalMcq}`);
  console.log(`  isMcq: true:                   ${withIsMcqTrue}`);
  console.log(`  options[] non-empty:            ${withOptions}`);
  console.log(`  explanation non-empty:          ${withExplanation}`);

  // Show 2 raw documents to see exactly what fields exist
  const samples = await col.find(
    { questionType: 'aptitude_mcq', verified: true },
    { projection: { problemSummary: 1, questionType: 1, isMcq: 1, options: 1, explanation: 1, sampleAnswer: 1, keyPoints: 1, sourceId: 1, _id: 0 } }
  ).limit(2).toArray();

  console.log(`\n  Raw field dump (2 sample documents):`);
  (samples as any[]).forEach((s, i) => {
    console.log(`\n  Doc ${i+1}: "${s.problemSummary}"`);
    console.log(`    isMcq:       ${JSON.stringify(s.isMcq)}`);
    console.log(`    options:     ${JSON.stringify(s.options)}`);
    console.log(`    explanation: ${JSON.stringify(s.explanation)}`);
    console.log(`    sampleAnswer:${JSON.stringify(s.sampleAnswer)}`);
    console.log(`    keyPoints:   ${JSON.stringify(s.keyPoints)}`);
    console.log(`    sourceId:    ${s.sourceId}`);
  });

  // Also check core_cs_mcq
  const totalCoreMcq = await col.countDocuments({ questionType: 'core_cs_mcq', verified: true });
  const coreWithOptions = await col.countDocuments({ questionType: 'core_cs_mcq', verified: true, 'options.0': { $exists: true } });
  console.log(`\n  core_cs_mcq (verified): ${totalCoreMcq}, with options: ${coreWithOptions}`);

  await mongoose.disconnect();
}
main().catch(async e => { console.error(e.message); await mongoose.disconnect(); process.exit(1); });
