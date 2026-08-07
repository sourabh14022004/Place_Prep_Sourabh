const mongoose = require("mongoose");

const ExperienceSchema = new mongoose.Schema(
  {
    companySlug: { type: String, lowercase: true },
    outcome: { type: String },
    author: { type: String },
    role: { type: String },
  },
  {
    timestamps: true,
    strict: false,
    collection: "interview_experiences",
  }
);

module.exports = mongoose.model("Experience", ExperienceSchema);
