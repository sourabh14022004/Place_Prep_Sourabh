const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // Auth & Identity
    clerkUserId: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // Optional if Clerk is used
    role: { type: String, enum: ["student", "faculty", "admin"], default: "student" },
    isFirstLogin: { type: Boolean, default: true },
    hasOnboarded: { type: Boolean, default: false },

    // Student Basic Profile
    name: { type: String, trim: true },
    avatarUrl: { type: String },
    college: { type: String, default: "Newton School of Technology" },
    batch: { type: String, default: "B.Tech CS & AI 2026" },
    degree: { type: String, default: "B.Tech CS & AI" },
    phone: { type: String },
    githubUrl: { type: String },
    linkedinUrl: { type: String },

    // Onboarding Selections (Steps 1 to 4)
    targetDomains: [{ type: String }],
    targetCategories: [{ type: String }],
    targetCompanies: [{ type: String }],
    prepDurationWeeks: { type: Number, default: 12 },
    topicRatings: { type: Map, of: Number },

    // Gamification & Progress
    xp: { type: Number, default: 0, index: true },
    level: { type: Number, default: 1 },
    streakDays: { type: Number, default: 1 },
    lastActiveDate: { type: Date, default: Date.now },
    solvedQuestions: [{ type: String }], // Question IDs or ObjectIds
    bookmarkedQuestions: [{ type: String }],

    // Active Custom Roadmap
    roadmap: {
      targetCompany: { type: String },
      durationWeeks: { type: Number, default: 12 },
      currentWeek: { type: Number, default: 1 },
      companies: [
        {
          slug: { type: String },
          name: { type: String },
          role: { type: String, default: "SDE-1" },
          addedAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  {
    timestamps: true,
    strict: false,
    collection: "users",
  }
);

module.exports = mongoose.model("User", UserSchema);
