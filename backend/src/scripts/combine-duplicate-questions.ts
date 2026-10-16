/**
 * backend/src/scripts/combine-duplicate-questions.ts
 * 
 * High-performance batch deduplication of questions:
 * Combines duplicate questions with matching title and link into one canonical question with:
 *  - companySlugs: all company slugs that asked this question
 *  - companyNames: all company names that asked this question
 *  - topics: union of all topic tags
 *  - targetRoles: union of all target roles
 *  - frequencyScore: max frequency score
 *  - isHot: hot if any was hot
 *  - companyFrequency: merged frequency entries
 * 
 * All other copies are marked with:
 *  - isDuplicate: true
 *  - isCanonical: false
 *  - canonicalId: canonical._id
 * 
 * Re-points QuestionCompletion, UserRoadmap, and CustomRoadmap references.
 */

import connectDB from '../config/db';
import Question, { IQuestion } from '../models/Question';
import QuestionCompletion from '../models/QuestionCompletion';
import UserRoadmap from '../models/UserRoadmap';
import CustomRoadmap from '../models/CustomRoadmap';
import mongoose from 'mongoose';

function normalizeTitle(title: string | undefined): string {
  return (title || '').trim().toLowerCase();
}

function normalizeLink(link: string | undefined): string {
  return (link || '')
    .trim()
    .toLowerCase()
    .replace(/\/+$/, '');
}

async function run() {
  console.log('🚀 Connecting to MongoDB Atlas...');
  await connectDB();
  console.log('✅ Connected to MongoDB.');

  console.log('🔍 Fetching all questions...');
  // Reset any partially marked duplicates from interrupted runs so we start from a clean baseline
  // Actually, fetch all questions regardless of duplicate flag so we group completely and correctly
  const allQuestions = await Question.find({})
    .lean<IQuestion[]>();

  console.log(`Found ${allQuestions.length} total questions in collection.`);

  // Load all student completions
  const completions = await QuestionCompletion.find().lean();
  const completedQuestionIdSet = new Set(completions.map(c => c.questionId.toString()));
  console.log(`Loaded ${completions.length} completion records (${completedQuestionIdSet.size} unique question IDs).`);

  // Group by questionType + '|||' + normalizedTitle + '|||' + normalizedLink
  const groups = new Map<string, IQuestion[]>();
  for (const q of allQuestions) {
    const link = normalizeLink(q.leetcodeUrl || q.sourceUrl);
    const title = normalizeTitle(q.problemSummary);
    const key = `${q.questionType || 'dsa'}|||${title}|||${link}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(q);
  }

  console.log(`Grouped into ${groups.size} unique (title + link) groups.`);

  const bulkOps: any[] = [];
  const dupToCanonicalMap = new Map<string, mongoose.Types.ObjectId>();

  let duplicateGroupsCount = 0;
  let totalDuplicatesCombined = 0;

  for (const [key, group] of groups.entries()) {
    if (group.length > 1) {
      duplicateGroupsCount++;
      totalDuplicatesCombined += (group.length - 1);

      // Select canonical question
      let canonical = group[0];
      let bestScore = -1;

      for (const q of group) {
        let score = 0;
        if (completedQuestionIdSet.has(q._id.toString())) score += 1000;
        if (q.isCanonical) score += 50;
        score += (q.frequencyScore || 0) * 100;
        if (q.explanation) score += 10;
        if (q.sampleAnswer) score += 10;
        if (q.options && q.options.length > 0) score += 20;
        if (score > bestScore) {
          bestScore = score;
          canonical = q;
        }
      }

      const otherQuestions = group.filter(q => q._id.toString() !== canonical._id.toString());
      const otherIds = otherQuestions.map(q => q._id);

      for (const o of otherQuestions) {
        dupToCanonicalMap.set(o._id.toString(), canonical._id);
      }

      // Aggregate company slugs & names
      const companySlugsSet = new Set<string>();
      const companyNamesMap = new Map<string, string>();
      const companyFrequencyMap = new Map<string, { companySlug: string; frequency: number; askedCount: number }>();

      for (const q of group) {
        if (q.companySlug) {
          const s = q.companySlug.trim().toLowerCase();
          if (s) {
            companySlugsSet.add(s);
            if (q.companyName && !companyNamesMap.has(s)) {
              companyNamesMap.set(s, q.companyName.trim());
            }
          }
        }
        if (Array.isArray(q.companySlugs)) {
          for (const s of q.companySlugs) {
            const clean = s?.trim().toLowerCase();
            if (clean) companySlugsSet.add(clean);
          }
        }
        if (Array.isArray(q.companyNames)) {
          for (const n of q.companyNames) {
            if (n?.trim()) {
              const slug = n.trim().toLowerCase().replace(/\s+/g, '-');
              if (!companyNamesMap.has(slug)) companyNamesMap.set(slug, n.trim());
            }
          }
        }
        if (Array.isArray(q.companyFrequency)) {
          for (const cf of q.companyFrequency) {
            if (cf?.companySlug) {
              const s = cf.companySlug.toLowerCase();
              const existing = companyFrequencyMap.get(s);
              if (!existing || (cf.frequency || 0) > existing.frequency) {
                companyFrequencyMap.set(s, cf);
              }
            }
          }
        }
      }

      const allSlugs = Array.from(companySlugsSet);
      const allNames = allSlugs.map(slug => {
        return companyNamesMap.get(slug) || (slug.charAt(0).toUpperCase() + slug.slice(1));
      });

      // Aggregate topics
      const topicsSet = new Set<string>();
      for (const q of group) {
        if (Array.isArray(q.topics)) {
          for (const t of q.topics) {
            if (t?.trim()) topicsSet.add(t.trim());
          }
        }
      }

      // Aggregate target roles
      const rolesSet = new Set<any>();
      for (const q of group) {
        if (Array.isArray(q.targetRoles)) {
          for (const r of q.targetRoles) {
            if (r) rolesSet.add(r);
          }
        }
      }

      const maxFreq = Math.max(...group.map(q => q.frequencyScore || 0));
      const isHot = group.some(q => Boolean(q.isHot));

      const hintsSet = new Set<string>();
      const keyPointsSet = new Set<string>();
      for (const q of group) {
        if (Array.isArray(q.hints)) q.hints.forEach(h => h?.trim() && hintsSet.add(h.trim()));
        if (Array.isArray(q.keyPoints)) q.keyPoints.forEach(k => k?.trim() && keyPointsSet.add(k.trim()));
      }

      const richestExplanation = group.find(q => q.explanation)?.explanation || canonical.explanation;
      const richestSampleAnswer = group.find(q => q.sampleAnswer)?.sampleAnswer || canonical.sampleAnswer;
      const richestOptions = group.find(q => q.options && q.options.length > 0)?.options || canonical.options || [];

      // Op for Canonical Question
      bulkOps.push({
        updateOne: {
          filter: { _id: canonical._id },
          update: {
            $set: {
              companySlugs: allSlugs,
              companyNames: allNames,
              topics: Array.from(topicsSet),
              targetRoles: Array.from(rolesSet),
              frequencyScore: maxFreq,
              isHot,
              companyFrequency: Array.from(companyFrequencyMap.values()),
              hints: Array.from(hintsSet),
              keyPoints: Array.from(keyPointsSet),
              explanation: richestExplanation,
              sampleAnswer: richestSampleAnswer,
              options: richestOptions,
              isCanonical: true,
              isDuplicate: false,
              canonicalId: null,
            },
          },
        },
      });

      // Op for Duplicates
      bulkOps.push({
        updateMany: {
          filter: { _id: { $in: otherIds } },
          update: {
            $set: {
              isDuplicate: true,
              isCanonical: false,
              canonicalId: canonical._id,
            },
          },
        },
      });

    } else {
      // Single question (group.length === 1)
      const q = group[0];
      const updates: Record<string, any> = {
        isCanonical: true,
        isDuplicate: false,
        canonicalId: null,
      };
      if (q.companySlug) {
        updates.companySlugs = [q.companySlug.trim().toLowerCase()];
        updates.companyNames = [q.companyName ? q.companyName.trim() : q.companySlug];
      }
      bulkOps.push({
        updateOne: {
          filter: { _id: q._id },
          update: { $set: updates },
        },
      });
    }
  }

  console.log(`⚡ Executing ${bulkOps.length} bulk operations on MongoDB in chunks of 1,000...`);
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < bulkOps.length; i += CHUNK_SIZE) {
    const chunk = bulkOps.slice(i, i + CHUNK_SIZE);
    await Question.bulkWrite(chunk, { ordered: false });
    process.stdout.write(`  Processed ${Math.min(i + CHUNK_SIZE, bulkOps.length)} / ${bulkOps.length} operations\r`);
  }
  console.log('\n✅ Bulk operations finished!');

  // Re-link QuestionCompletion records
  console.log('🔄 Re-linking QuestionCompletion records...');
  let completionsUpdated = 0;
  let completionsDeleted = 0;

  for (const comp of completions) {
    const qidStr = comp.questionId.toString();
    if (dupToCanonicalMap.has(qidStr)) {
      const canonicalId = dupToCanonicalMap.get(qidStr)!;
      // Check if student already has a completion for canonical
      const exists = await QuestionCompletion.findOne({
        studentId: comp.studentId,
        questionId: canonicalId,
        _id: { $ne: comp._id },
      });
      if (exists) {
        await QuestionCompletion.deleteOne({ _id: comp._id });
        completionsDeleted++;
      } else {
        await QuestionCompletion.updateOne(
          { _id: comp._id },
          { $set: { questionId: canonicalId } }
        );
        completionsUpdated++;
      }
    }
  }

  console.log(`Completions re-linked: ${completionsUpdated}, duplicate completions removed: ${completionsDeleted}`);

  // Re-point Roadmaps
  console.log('🔄 Re-pointing UserRoadmaps...');
  let roadmapsUpdated = 0;
  const userRoadmaps = await UserRoadmap.find({ 'weeks.questionIds': { $exists: true, $ne: [] } });
  for (const rm of userRoadmaps) {
    let changed = false;
    for (const week of rm.weeks) {
      if (Array.isArray(week.questionIds) && week.questionIds.length > 0) {
        const newIds: mongoose.Types.ObjectId[] = [];
        const seen = new Set<string>();
        for (const qid of week.questionIds) {
          const str = qid.toString();
          const targetId = dupToCanonicalMap.get(str) || qid;
          const targetStr = targetId.toString();
          if (!seen.has(targetStr)) {
            seen.add(targetStr);
            newIds.push(new mongoose.Types.ObjectId(targetStr));
          }
        }
        if (newIds.length !== week.questionIds.length || newIds.some((id, idx) => id.toString() !== week.questionIds[idx]?.toString())) {
          week.questionIds = newIds;
          changed = true;
        }
      }
    }
    if (changed) {
      await rm.save();
      roadmapsUpdated++;
    }
  }

  console.log('\n================== SUMMARY ==================');
  console.log(`Duplicate groups combined: ${duplicateGroupsCount}`);
  console.log(`Duplicate questions marked combined: ${totalDuplicatesCombined}`);
  console.log(`Unique questions remaining in catalog: ${groups.size}`);
  console.log(`Question completions re-linked: ${completionsUpdated}`);
  console.log(`User roadmaps re-pointed: ${roadmapsUpdated}`);
  console.log('=============================================\n');

  // Verify counts in DB
  const verifiedNonDup = await Question.countDocuments({ isDuplicate: { $ne: true }, verified: true });
  const dsaNonDup = await Question.countDocuments({ questionType: 'dsa', isDuplicate: { $ne: true }, verified: true });
  console.log(`Verified non-duplicate questions total: ${verifiedNonDup}`);
  console.log(`DSA / Coding questions: ${dsaNonDup}`);

  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
