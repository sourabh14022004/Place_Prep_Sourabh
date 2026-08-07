const express = require("express");
const router = express.Router();
const User = require("../models/User");

const DEMO_CREDENTIALS = [
  {
    role: "student",
    label: "Student Portal",
    email: "student@newtonschool.co",
    password: "student123",
    description: "Access interview prep, topic practice, and company questions.",
    portal_url: "http://localhost:3000/dashboard",
    accent_color: "blue"
  },
  {
    role: "faculty",
    label: "Faculty Portal",
    email: "faculty@newtonschool.co",
    password: "faculty123",
    description: "View gap heatmaps, resolve student doubts, & manage syllabus alignment.",
    portal_url: "http://localhost:3001/",
    accent_color: "indigo"
  },
  {
    role: "admin",
    label: "Admin Portal",
    email: "admin@newtonschool.co",
    password: "admin123",
    description: "Full control panel for students, faculty, session monitoring & metrics.",
    portal_url: "http://localhost:3002/overview",
    accent_color: "purple"
  }
];

const ALIASES = {
  "student@nst.edu": "student@newtonschool.co",
  "faculty@nst.edu": "faculty@newtonschool.co",
  "admin@nst.edu": "admin@newtonschool.co"
};

// GET /api/auth/credentials - Get list of pre-configured demo portal credentials
router.get("/credentials", (req, res) => {
  res.json(DEMO_CREDENTIALS);
});

// POST /api/auth/login - Authenticate user login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const rawEmail = email.trim().toLowerCase();
  const normalizedEmail = ALIASES[rawEmail] || rawEmail;

  try {
    const mongoose = require("mongoose");
    let user = null;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: normalizedEmail });
    }

    // Fallback to static credentials if user DB is not seeded yet
    if (!user) {
      const demoAccount = DEMO_CREDENTIALS.find((c) => c.email === normalizedEmail);
      if (demoAccount) {
        if (password !== demoAccount.password) {
          return res.status(401).json({
            success: false,
            message: "Incorrect password. Check the demo credentials password."
          });
        }

        const token = `jwt_mock_token_for_${demoAccount.role}_demo`;
        return res.json({
          success: true,
          message: `Welcome back! Logging into ${demoAccount.role.toUpperCase()} Portal...`,
          token,
          user: {
            id: `demo_${demoAccount.role}`,
            name: `${demoAccount.role.toUpperCase()} Demo User`,
            email: demoAccount.email,
            role: demoAccount.role,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${demoAccount.role}`,
            department_or_batch: "Newton School of Technology",
            target_portal_url: demoAccount.portal_url
          }
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid email or password. Use one of the demo credentials."
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Check the credentials."
      });
    }

    const token = `jwt_mock_token_for_${user.role}_${user._id}`;
    return res.json({
      success: true,
      message: `Welcome back, ${user.name}! Logging into ${user.role.toUpperCase()} Portal...`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department_or_batch: user.department_or_batch,
        target_portal_url: user.target_portal_url
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
