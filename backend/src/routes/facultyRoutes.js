const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Faculty = require("../models/Faculty");

// Helper to normalize faculty response
function normalizeFaculty(faculty) {
  return {
    _id: faculty._id,
    clerkUserId: faculty.clerkUserId,
    email: faculty.email,
    name: faculty.name || "Prof. Sharma",
    title: faculty.title || "Senior Faculty, Computer Science Dept.",
    employeeId: faculty.employeeId || "EMP-4092",
    department: faculty.department || "CS & Engineering",
    campus: faculty.campus || "Bangalore Campus",
    joinedYear: faculty.joinedYear || "2021",
    joined: faculty.joined || "Aug 2021",
    experience: faculty.experience || "12+ Years Experience",
    avatarUrl: faculty.avatarUrl || null,
    role: "faculty",
    expertises: faculty.expertises && faculty.expertises.length > 0
      ? faculty.expertises
      : ["Data Structures", "Algorithms", "System Design", "Cloud Architecture"],
    subjectsTaught: faculty.subjectsTaught || ["DSA", "System Design", "Web Development", "DBMS & SQL"],
    assignedCohorts: faculty.assignedCohorts || ["Batch 2023-2027 (CS)", "Batch 2024-2028 (AI)"],
    mentorshipStats: faculty.mentorshipStats || {
      studentsMentored: 450,
      mockInterviewsTaken: 120,
      placementRatePercent: 85,
      rating: 4.9,
      doubtsSolvedThisMonth: 12,
      doubtsSolvedAllTime: 145,
    },
    officeHours: faculty.officeHours || {
      days: ["Mon", "Wed", "Fri"],
      timeSlot: "04:00 PM - 06:00 PM",
      location: "Room 304, Academic Block A",
    },
    createdAt: faculty.createdAt,
  };
}

// Helper to safely find faculty by clerkUserId or email, linking clerkUserId if missing
async function findFaculty(clerkUserId, email) {
  const conditions = [];
  if (clerkUserId) conditions.push({ clerkUserId });
  if (email) conditions.push({ email: email.toLowerCase() });

  if (conditions.length === 0) return null;

  let faculty = await Faculty.findOne({ $or: conditions });
  if (faculty && clerkUserId && faculty.clerkUserId !== clerkUserId) {
    faculty.clerkUserId = clerkUserId;
    await faculty.save();
  }
  return faculty;
}

// GET /api/faculty/profile - Fetch faculty profile by clerkUserId or email
router.get("/profile", async (req, res) => {
  const { clerkUserId, email } = req.query;

  if (!clerkUserId && !email) {
    return res.status(400).json({ success: false, message: "clerkUserId or email parameter required" });
  }

  try {
    let faculty = await findFaculty(clerkUserId, email);

    if (!faculty) {
      // Auto-provision faculty profile if first time
      faculty = await Faculty.create({
        clerkUserId: clerkUserId || undefined,
        email: email ? email.toLowerCase() : "sharma.p@newtonschool.co",
        name: email ? email.split("@")[0].replace(".", " ").toUpperCase() : "Prof. Sharma",
        title: "Senior Faculty, Computer Science Dept.",
        employeeId: "EMP-4092",
        department: "CS & Engineering",
        campus: "Bangalore Campus",
        joinedYear: "2021",
        joined: "Aug 2021",
        experience: "12+ Years Experience",
        role: "faculty",
        expertises: ["Data Structures", "Algorithms", "System Design", "Cloud Architecture"],
      });
    }

    return res.json({
      success: true,
      data: normalizeFaculty(faculty.toObject ? faculty.toObject() : faculty),
    });
  } catch (error) {
    console.error("Error fetching faculty profile:", error);
    return res.status(500).json({ success: false, message: "Error fetching faculty profile" });
  }
});

// PUT /api/faculty/profile - Update editable faculty profile fields
router.put("/profile", async (req, res) => {
  const {
    clerkUserId,
    email,
    name,
    title,
    experience,
    campus,
    department,
    employeeId,
    joined,
    expertises,
    officeHours,
  } = req.body;

  if (!clerkUserId && !email) {
    return res.status(400).json({ success: false, message: "clerkUserId or email is required" });
  }

  try {
    let faculty = await findFaculty(clerkUserId, email);

    if (!faculty) {
      faculty = await Faculty.create({
        clerkUserId: clerkUserId || undefined,
        email: email ? email.toLowerCase() : "sharma.p@newtonschool.co",
        role: "faculty",
        name: name || "Prof. Sharma",
        title: title || "Senior Faculty, Computer Science Dept.",
        experience: experience || "12+ Years Experience",
        campus: campus || "Bangalore Campus",
        department: department || "CS & Engineering",
        employeeId: employeeId || "EMP-4092",
        joined: joined || "Aug 2021",
        expertises: expertises || ["Data Structures", "Algorithms", "System Design", "Cloud Architecture"],
      });
    } else {
      if (clerkUserId) faculty.clerkUserId = clerkUserId;
      if (name !== undefined) faculty.name = name;
      if (title !== undefined) faculty.title = title;
      if (experience !== undefined) faculty.experience = experience;
      if (campus !== undefined) faculty.campus = campus;
      if (department !== undefined) faculty.department = department;
      if (employeeId !== undefined) faculty.employeeId = employeeId;
      if (joined !== undefined) faculty.joined = joined;
      if (Array.isArray(expertises)) faculty.expertises = expertises;
      if (officeHours) faculty.officeHours = officeHours;

      await faculty.save();
    }

    return res.json({
      success: true,
      message: "Faculty profile updated successfully",
      data: normalizeFaculty(faculty.toObject ? faculty.toObject() : faculty),
    });
  } catch (error) {
    console.error("Error updating faculty profile:", error);
    return res.status(500).json({ success: false, message: "Error updating faculty profile" });
  }
});

// GET /api/faculty/all - List all faculty members
router.get("/all", async (req, res) => {
  try {
    const rawFaculties = await Faculty.find({ isActive: true }).lean();
    const faculties = rawFaculties.map(normalizeFaculty);

    return res.json({
      success: true,
      count: faculties.length,
      data: faculties,
    });
  } catch (error) {
    console.error("Error fetching all faculty members:", error);
    return res.status(500).json({ success: false, message: "Error fetching faculty members" });
  }
});

module.exports = router;
