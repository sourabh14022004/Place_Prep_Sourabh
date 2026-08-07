const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");

// Helper to normalize user response
function normalizeUser(user) {
  const xp = user.xp || 0;
  const level = Math.floor(xp / 500) + 1;
  return {
    _id: user._id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name || user.email?.split("@")[0] || "Student",
    avatarUrl: user.avatarUrl || null,
    role: user.role || "student",
    college: user.college || "Newton School of Technology",
    batch: user.batch || "B.Tech CS & AI 2026",
    degree: user.degree || "B.Tech CS & AI",
    phone: user.phone || "",
    githubUrl: user.githubUrl || "",
    linkedinUrl: user.linkedinUrl || "",
    hasOnboarded: user.hasOnboarded || false,
    isFirstLogin: user.isFirstLogin || false,
    targetDomains: user.targetDomains || [],
    targetCategories: user.targetCategories || [],
    targetCompanies: user.targetCompanies || [],
    prepDurationWeeks: user.prepDurationWeeks || 12,
    topicRatings: user.topicRatings ? Object.fromEntries(user.topicRatings) : {},
    xp,
    level,
    streakDays: user.streakDays || 1,
    solvedQuestions: user.solvedQuestions || [],
    bookmarkedQuestions: user.bookmarkedQuestions || [],
    roadmap: user.roadmap || {
      targetCompany: "google",
      durationWeeks: 12,
      currentWeek: 1,
      companies: [
        { slug: "google", name: "Google", role: "SDE-1", addedAt: new Date() },
        { slug: "amazon", name: "Amazon", role: "SDE-1", addedAt: new Date() },
      ],
    },
    createdAt: user.createdAt,
  };
}

// Helper to safely find user by clerkUserId or email, linking clerkUserId if missing
async function findUser(clerkUserId, email) {
  const conditions = [];
  if (clerkUserId) conditions.push({ clerkUserId });
  if (email) conditions.push({ email: email.toLowerCase() });

  if (conditions.length === 0) return null;

  let user = await User.findOne({ $or: conditions });
  if (user && clerkUserId && user.clerkUserId !== clerkUserId) {
    user.clerkUserId = clerkUserId;
    await user.save();
  }
  return user;
}

// GET /api/user/profile - Fetch student profile by clerkUserId or email
router.get("/profile", async (req, res) => {
  const { clerkUserId, email } = req.query;

  if (!clerkUserId && !email) {
    return res.status(400).json({ success: false, message: "clerkUserId or email parameter required" });
  }

  try {
    let user = await findUser(clerkUserId, email);

    if (!user) {
      // Auto-provision student profile if first time
      user = await User.create({
        clerkUserId: clerkUserId || undefined,
        email: email ? email.toLowerCase() : `student_${Date.now()}@newtonschool.co`,
        name: email ? email.split("@")[0] : "Student",
        role: "student",
        isFirstLogin: false,
        hasOnboarded: false,
        xp: 150,
      });
    }

    return res.json({
      success: true,
      data: normalizeUser(user.toObject ? user.toObject() : user),
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ success: false, message: "Error fetching user profile" });
  }
});

// POST /api/user/onboarding - Save student onboarding selections & roadmap
router.get("/onboarding", (req, res) => res.json({ success: true, message: "Use POST to submit onboarding data" }));

router.post("/onboarding", async (req, res) => {
  const {
    clerkUserId,
    email,
    name,
    targetDomains,
    targetCategories,
    targetCompanies,
    prepDurationWeeks,
    topicRatings,
  } = req.body;

  if (!clerkUserId && !email) {
    return res.status(400).json({ success: false, message: "clerkUserId or email is required" });
  }

  try {
    let user = await findUser(clerkUserId, email);

    const roadmapCompanies = Array.isArray(targetCompanies) && targetCompanies.length > 0
      ? targetCompanies.map((slug) => ({
          slug,
          name: slug.charAt(0).toUpperCase() + slug.slice(1),
          role: "SDE-1",
          addedAt: new Date(),
        }))
      : [
          { slug: "google", name: "Google", role: "SDE-1", addedAt: new Date() },
          { slug: "amazon", name: "Amazon", role: "SDE-1", addedAt: new Date() },
        ];

    const updateData = {
      name: name || user?.name || "Student",
      hasOnboarded: true,
      targetDomains: targetDomains || [],
      targetCategories: targetCategories || [],
      targetCompanies: targetCompanies || ["google", "amazon"],
      prepDurationWeeks: prepDurationWeeks || 12,
      topicRatings: topicRatings || {},
      roadmap: {
        targetCompany: targetCompanies?.[0] || "google",
        durationWeeks: prepDurationWeeks || 12,
        currentWeek: 1,
        companies: roadmapCompanies,
      },
    };

    if (!user) {
      user = await User.create({
        clerkUserId: clerkUserId || undefined,
        email: email ? email.toLowerCase() : undefined,
        role: "student",
        xp: 250,
        ...updateData,
      });
    } else {
      if (clerkUserId) user.clerkUserId = clerkUserId;
      Object.assign(user, updateData);
      await user.save();
    }

    return res.json({
      success: true,
      message: "Onboarding data saved successfully",
      data: normalizeUser(user.toObject ? user.toObject() : user),
    });
  } catch (error) {
    console.error("Error saving onboarding data:", error);
    return res.status(500).json({ success: false, message: "Error saving onboarding data" });
  }
});

// PUT /api/user/profile - Update student editable profile fields
router.put("/profile", async (req, res) => {
  const { clerkUserId, email, name, phone, githubUrl, linkedinUrl, batch, targetCompanies } = req.body;

  if (!clerkUserId && !email) {
    return res.status(400).json({ success: false, message: "clerkUserId or email is required" });
  }

  try {
    const user = await findUser(clerkUserId, email);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (githubUrl !== undefined) user.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl;
    if (batch !== undefined) user.batch = batch;
    if (Array.isArray(targetCompanies)) user.targetCompanies = targetCompanies;

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: normalizeUser(user.toObject ? user.toObject() : user),
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ success: false, message: "Error updating profile" });
  }
});

// POST /api/user/solve-question - Mark question solved and award XP
router.post("/solve-question", async (req, res) => {
  const { clerkUserId, email, questionId, xpValue = 20 } = req.body;

  if (!questionId) {
    return res.status(400).json({ success: false, message: "questionId is required" });
  }

  try {
    let user = await findUser(clerkUserId, email);

    if (!user) {
      user = await User.create({
        clerkUserId: clerkUserId || undefined,
        email: email ? email.toLowerCase() : `student_${Date.now()}@newtonschool.co`,
        role: "student",
        xp: 0,
      });
    }

    const qStr = questionId.toString();
    if (!user.solvedQuestions.includes(qStr)) {
      user.solvedQuestions.push(qStr);
      user.xp = (user.xp || 0) + (parseInt(xpValue, 10) || 20);
      user.level = Math.floor(user.xp / 500) + 1;
      await user.save();
    }

    return res.json({
      success: true,
      message: "Question marked as solved",
      xpEarned: xpValue,
      totalXp: user.xp,
      solvedCount: user.solvedQuestions.length,
    });
  } catch (error) {
    console.error("Error marking question solved:", error);
    return res.status(500).json({ success: false, message: "Error updating solved status" });
  }
});

// GET /api/user/leaderboard - Get top students ranked by XP
router.get("/leaderboard", async (req, res) => {
  try {
    const topUsers = await User.find({ role: { $ne: "faculty" } })
      .sort({ xp: -1 })
      .limit(20)
      .lean();

    const leaderboard = topUsers.map((u, idx) => ({
      rank: idx + 1,
      id: u._id,
      name: u.name || "Student",
      email: u.email,
      batch: u.batch || "B.Tech CS 2026",
      xp: u.xp || 150,
      level: Math.floor((u.xp || 150) / 500) + 1,
      solvedCount: (u.solvedQuestions || []).length || 12,
      targetCompany: (u.targetCompanies && u.targetCompanies[0]) || "google",
    }));

    return res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({ success: false, message: "Error fetching leaderboard" });
  }
});

module.exports = router;
