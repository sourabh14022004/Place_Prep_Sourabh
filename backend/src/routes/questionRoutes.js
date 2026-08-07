const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Question = require("../models/Question");

function normalizeQuestion(q) {
  const title = q.problemSummary || q.title || "Interview Question";
  const topicsList = Array.isArray(q.topics) && q.topics.length > 0 ? q.topics : (q.topic ? [q.topic] : ["DSA"]);
  const mainTopic = topicsList[0];
  const diff = q.difficulty || q.diff || "Medium";
  const freqPct = q.frequencyScore !== undefined
    ? Math.round(q.frequencyScore * 100)
    : (q.frequency !== undefined ? q.frequency : 75);
  const xp = q.xpValue !== undefined ? q.xpValue : (q.xp !== undefined ? q.xp : 10);

  return {
    ...q,
    id: q._id ? q._id.toString() : q.id,
    companyId: q.companyId,
    companySlug: q.companySlug,
    companyName: q.companyName || q.companySlug,
    roundType: q.roundType || "Coding",
    roundNumber: q.roundNumber || 1,
    problemSummary: q.problemSummary || title,
    title: title,
    difficulty: diff,
    diff: diff,
    topics: topicsList,
    topic: mainTopic,
    source: q.source || "leetcode",
    sourceUrl: q.sourceUrl || null,
    leetcodeUrl: q.leetcodeUrl || (q.source === "leetcode" ? q.sourceUrl : null),
    frequencyScore: q.frequencyScore !== undefined ? q.frequencyScore : (freqPct / 100),
    frequency: freqPct,
    xpValue: xp,
    xp: xp,
    isHot: q.isHot !== undefined ? q.isHot : (q.hot || false),
    hot: q.isHot !== undefined ? q.isHot : (q.hot || false),
    verified: q.verified || false,
    isSeeded: q.isSeeded || false,
  };
}

// GET /api/questions - Filter & search questions from MongoDB Atlas
// Params: companySlug, topic, difficulty, roundType, search, page, limit
router.get("/", async (req, res) => {
  const {
    companySlug,
    company,
    topic,
    difficulty,
    diff,
    roundType,
    round_type,
    search,
    page = 1,
    limit = 50
  } = req.query;

  const targetCompany = companySlug || company;
  const targetDiff = difficulty || diff;
  const targetRound = roundType || round_type;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  try {
    const filter = {};

    if (targetCompany && targetCompany !== "All") {
      const compRegex = new RegExp(targetCompany, "i");
      filter.$or = [
        { companySlug: compRegex },
        { company_slug: compRegex },
        { companyName: compRegex },
        { companies: { $in: [targetCompany.toLowerCase()] } }
      ];
    }

    if (topic && topic !== "All") {
      filter.topics = new RegExp(topic, "i");
    }

    if (targetDiff && targetDiff !== "All") {
      filter.difficulty = new RegExp(`^${targetDiff}$`, "i");
    }

    if (targetRound && targetRound !== "All") {
      filter.roundType = new RegExp(targetRound, "i");
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { problemSummary: searchRegex },
        { title: searchRegex },
        { topics: searchRegex }
      ];
    }

    const total = await Question.countDocuments(filter);
    const rawQuestions = await Question.find(filter).skip(skip).limit(limitNum).lean();
    const questions = rawQuestions.map(normalizeQuestion);

    return res.json({
      success: true,
      count: questions.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: questions
    });
  } catch (error) {
    console.error("Error searching questions:", error);
    return res.status(500).json({ success: false, message: error.message || "Error searching questions" });
  }
});

// GET /api/questions/:id - Get question details by MongoDB _id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const rawQuestion = await Question.findById(id).lean();
      if (rawQuestion) {
        return res.json({ success: true, data: normalizeQuestion(rawQuestion) });
      }
    }

    return res.status(404).json({ success: false, message: `Question with ID '${id}' not found` });
  } catch (error) {
    console.error(`Error fetching question ID '${id}':`, error);
    return res.status(500).json({ success: false, message: "Error fetching question details" });
  }
});

module.exports = router;
