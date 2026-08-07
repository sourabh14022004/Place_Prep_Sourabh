const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Experience = require("../models/Experience");

const FALLBACK_EXPERIENCES = [
  {
    _id: "66aa02020202020202020201",
    companySlug: "google",
    role: "SDE-1",
    author: "Aarav S.",
    outcome: "offer",
    date: "2026-05-15",
    summary: "6 rounds total: 1 OA + 1 Tech Screen + 3 Onsite DSA + 1 Googliness. Graph BFS/DFS questions were critical.",
    rounds: [
      { name: "OA", rating: "Hard", notes: "2 questions in 90 mins" },
      { name: "Onsite 1", rating: "Medium", notes: "Binary tree serialization & deserialization" }
    ]
  },
  {
    _id: "66aa02020202020202020202",
    companySlug: "amazon",
    role: "SDE-1 (AWS)",
    author: "Rohan M.",
    outcome: "offer",
    date: "2026-06-10",
    summary: "Online Assessment + 3 Virtual Onsite rounds. 14 Leadership Principles scenarios asked in every round.",
    rounds: [
      { name: "OA", rating: "Medium", notes: "Debug 7 questions + 2 coding" },
      { name: "Bar Raiser", rating: "Hard", notes: "Deep dive into ownership and customer obsession" }
    ]
  },
  {
    _id: "66aa02020202020202020203",
    companySlug: "flipkart",
    role: "UI Engineer",
    author: "Priya P.",
    outcome: "rejected",
    date: "2026-04-20",
    summary: "Machine Coding round required building a complete dynamic UI component in 2 hours.",
    rounds: [
      { name: "Machine Coding", rating: "Hard", notes: "Failed on edge case handling for infinite scroll" }
    ]
  }
];

// GET /api/experiences - List student interview experiences
// Params: companySlug, outcome (offer, rejected), page, limit
router.get("/", async (req, res) => {
  const { companySlug, outcome, page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  try {
    if (mongoose.connection.readyState === 1) {
      const filter = {};

      if (companySlug) {
        filter.companySlug = new RegExp(companySlug, "i");
      }

      if (outcome) {
        filter.outcome = new RegExp(`^${outcome}$`, "i");
      }

      const total = await Experience.countDocuments(filter);
      const experiences = await Experience.find(filter).skip(skip).limit(limitNum).lean();

      if (experiences && experiences.length > 0) {
        return res.json({
          success: true,
          count: experiences.length,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum) || 1,
          data: experiences
        });
      }
    }

    // Fallback search filtering
    let filtered = FALLBACK_EXPERIENCES;
    if (companySlug) {
      filtered = filtered.filter(
        (e) => e.companySlug && e.companySlug.toLowerCase() === companySlug.toLowerCase()
      );
    }
    if (outcome) {
      filtered = filtered.filter(
        (e) => e.outcome && e.outcome.toLowerCase() === outcome.toLowerCase()
      );
    }

    const paginated = filtered.slice(skip, skip + limitNum);

    return res.json({
      success: true,
      count: paginated.length,
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum) || 1,
      data: paginated
    });
  } catch (error) {
    console.error("Error listing experiences:", error);
    return res.status(500).json({ success: false, message: "Error listing interview experiences" });
  }
});

module.exports = router;
