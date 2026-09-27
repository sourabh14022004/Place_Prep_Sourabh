/**
 * backend/src/scripts/backfill-roadmap-questionids.ts
 *
 * Populates missing questionIds in existing user_roadmaps weeks.
 *
 * Usage:
 *   npx ts-node -P backend/tsconfig.json -r dotenv/config backend/src/scripts/backfill-roadmap-questionids.ts dotenv_config_path=backend/.env
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import UserRoadmap from '../models/UserRoadmap';
import Question from '../models/Question';

async function main(): Promise<void> {
  console.log('\n  backfill-roadmap-questionids starting...\n');
  await connectDB();

  const roadmaps = await UserRoadmap.find({});
  console.log(`  Found ${roadmaps.length} user roadmaps to process.`);

  let updatedCount = 0;

  for (const r of roadmaps) {
    let modified = false;
    const usedIds = new Set<string>();

    // Collect all already present questionIds to prevent duplicates within the roadmap
    for (const w of r.weeks || []) {
      if (w.questionIds && w.questionIds.length > 0) {
        w.questionIds.forEach((id: any) => usedIds.add(id.toString()));
      }
    }

    for (const w of r.weeks || []) {
      if (w.questionIds && w.questionIds.length > 0) {
        continue;
      }

      const topic = w.topicLabel;
      let topicFilter: any = topic;
      if (topic.includes('&')) {
        const parts = topic.split('&').map((p: string) => p.trim()).filter(Boolean);
        topicFilter = { $in: [topic, ...parts] };
      } else if (topic.includes(',')) {
        const parts = topic.split(',').map((p: string) => p.trim()).filter(Boolean);
        topicFilter = { $in: [topic, ...parts] };
      }

      const excludeObjIds = Array.from(usedIds).map(id => new mongoose.Types.ObjectId(id));
      const limit = w.totalQuestions || 7;

      // 1. Primary: match company + topic
      let query: any = {
        isDuplicate: { $ne: true },
        verified: true,
        companySlug: r.companySlug,
        topics: topicFilter,
        _id: { $nin: excludeObjIds },
      };

      let qs = await Question.find(query).sort({ frequencyScore: -1, isHot: -1 }).limit(limit).lean();

      // 2. Fallback: match company alone
      if (qs.length === 0) {
        query = {
          isDuplicate: { $ne: true },
          verified: true,
          companySlug: r.companySlug,
          _id: { $nin: excludeObjIds },
        };
        qs = await Question.find(query).sort({ frequencyScore: -1, isHot: -1 }).limit(limit).lean();
      }

      // 3. Fallback: match generic pool (for system design, aptitude, etc.)
      if (qs.length === 0) {
        query = {
          isDuplicate: { $ne: true },
          verified: true,
          topics: topicFilter,
          _id: { $nin: excludeObjIds },
        };
        qs = await Question.find(query).sort({ frequencyScore: -1, isHot: -1 }).limit(limit).lean();
      }

      if (qs.length > 0) {
        w.questionIds = qs.map((q: any) => q._id);
        w.totalQuestions = qs.length;
        qs.forEach((q: any) => usedIds.add(q._id.toString()));
        modified = true;
      }
    }

    if (modified) {
      r.markModified('weeks');
      await r.save();
      updatedCount++;
      console.log(`  Updated roadmap ${r.companyName} (${r.companySlug}) for student ${r.studentId}`);
    }
  }

  console.log(`\n  Done! Updated ${updatedCount} roadmaps.\n`);
  await mongoose.disconnect();
}

main().catch(async err => {
  console.error('[fatal]', err);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
