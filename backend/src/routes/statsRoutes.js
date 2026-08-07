const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Company = require("../models/Company");
const Question = require("../models/Question");
const Experience = require("../models/Experience");

// GET /api/stats - Database Statistics & Metrics
router.get("/stats", async (req, res) => {
  try {
    let totalCompanies = 167;
    let totalQuestions = 12433;
    let totalExperiences = 450;
    let categoryBreakdown = { maang: 12, product: 45, service: 70, startup: 40 };
    let difficultyBreakdown = { Easy: 3200, Medium: 6800, Hard: 2433 };

    if (mongoose.connection.readyState === 1) {
      const dbCompCount = await Company.countDocuments();
      const dbQuestCount = await Question.countDocuments();
      const dbExpCount = await Experience.countDocuments();

      if (dbCompCount > 0) totalCompanies = dbCompCount;
      if (dbQuestCount > 0) totalQuestions = dbQuestCount;
      if (dbExpCount > 0) totalExperiences = dbExpCount;

      // Aggregations if DB available
      const catAgg = await Company.aggregate([
        {
          $group: {
            _id: { $toLower: { $ifNull: ["$category", { $ifNull: ["$tier", "other"] }] } },
            count: { $sum: 1 },
          },
        },
      ]);
      if (catAgg && catAgg.length > 0) {
        categoryBreakdown = {};
        catAgg.forEach((item) => {
          categoryBreakdown[item._id || "other"] = item.count;
        });
      }

      const diffAgg = await Question.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$difficulty", { $ifNull: ["$diff", "Unspecified"] }] },
            count: { $sum: 1 },
          },
        },
      ]);
      if (diffAgg && diffAgg.length > 0) {
        difficultyBreakdown = {};
        diffAgg.forEach((item) => {
          difficultyBreakdown[item._id] = item.count;
        });
      }
    }

    res.json({
      success: true,
      service: "PlacePrep Express API Server",
      databaseStatus: mongoose.connection.readyState === 1 ? "connected" : "fallback_mode",
      stats: {
        totalCompanies,
        totalQuestions,
        totalExperiences,
        categories: categoryBreakdown,
        difficulties: difficultyBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, message: "Error calculating stats" });
  }
});

module.exports = router;
