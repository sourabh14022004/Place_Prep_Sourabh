const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    companySlug: { type: String, lowercase: true, index: true },
    companyName: { type: String },
    roundType: { type: String },
    roundNumber: { type: Number },
    problemSummary: { type: String },
    difficulty: { type: String },
    topics: [{ type: String }],
    source: { type: String },
    sourceUrl: { type: String },
    leetcodeUrl: { type: String },
    frequencyScore: { type: Number, default: 0 },
    xpValue: { type: Number, default: 10 },
    isHot: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    isSeeded: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    strict: false,
    collection: "questions",
  }
);

module.exports = mongoose.model("Question", QuestionSchema);
