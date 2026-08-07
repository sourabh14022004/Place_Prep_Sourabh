const mongoose = require("mongoose");

const FacultySchema = new mongoose.Schema(
  {
    // Auth & Identity
    clerkUserId: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // Optional if Clerk is used
    role: { type: String, default: "faculty", immutable: true },
    isFirstLogin: { type: Boolean, default: true },

    // Basic Academic Profile
    name: { type: String, required: true, trim: true },
    title: { type: String, default: "Senior Faculty, Computer Science Dept." },
    employeeId: { type: String, default: "EMP-4092" },
    department: { type: String, default: "CS & Engineering" },
    campus: { type: String, default: "Bangalore Campus" },
    joinedYear: { type: String, default: "2021" },
    avatarUrl: { type: String },
    bio: { type: String, default: "Specializing in DSA, System Design, and Cloud Architecture." },

    // Academic & Teaching Focus
    expertises: [{ type: String }],
    subjectsTaught: [{ type: String }],
    assignedCohorts: [{ type: String }],

    // Mentorship & Faculty Metrics
    mentorshipStats: {
      studentsMentored: { type: Number, default: 450 },
      mockInterviewsTaken: { type: Number, default: 120 },
      placementRatePercent: { type: Number, default: 85 },
      rating: { type: Number, default: 4.9 },
      doubtsSolvedThisMonth: { type: Number, default: 12 },
      doubtsSolvedAllTime: { type: Number, default: 145 },
    },

    // Session Availability & Office Hours
    officeHours: {
      days: [{ type: String }],
      timeSlot: { type: String, default: "04:00 PM - 06:00 PM" },
      location: { type: String, default: "Room 304, Academic Block A" },
    },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    strict: false,
    collection: "faculties",
  }
);

module.exports = mongoose.model("Faculty", FacultySchema);
