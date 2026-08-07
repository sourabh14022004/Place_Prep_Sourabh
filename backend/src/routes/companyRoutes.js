const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Company = require("../models/Company");
const Question = require("../models/Question");

const FALLBACK_COMPANIES = [
  {
    name: "Google",
    slug: "google",
    country: "India",
    tier: "MAANG",
    category: "maang",
    successRate: "18.4%",
    avgSalary: "₹45 LPA",
    difficulty: "9.2/10",
    hiringStatus: "Active Hiring",
    avgProcess: "4-6 Weeks",
    hiringNote: "Heavy emphasis on Graph algorithms, Dynamic Programming, and High-Level System Design.",
    roundStructure: [
      { n: 1, name: "Online Assessment (OA)", dur: "90 mins" },
      { n: 2, name: "Technical Screen", dur: "45 mins" },
      { n: 3, name: "Onsite Round 1 (DSA)", dur: "45 mins" },
      { n: 4, name: "Onsite Round 2 (DSA)", dur: "45 mins" },
      { n: 5, name: "Onsite Round 3 (System Design)", dur: "45 mins" },
      { n: 6, name: "Googliness & Leadership", dur: "45 mins" }
    ],
    topTopics: [
      { topic: "Arrays & Strings", pct: 85 },
      { topic: "Dynamic Programming", pct: 72 },
      { topic: "Graphs & Trees", pct: 68 },
      { topic: "System Design", pct: 54 }
    ]
  },
  {
    name: "Amazon",
    slug: "amazon",
    country: "India",
    tier: "MAANG",
    category: "maang",
    successRate: "22.1%",
    avgSalary: "₹32 LPA",
    difficulty: "8.5/10",
    hiringStatus: "Active Hiring",
    avgProcess: "3-4 Weeks",
    hiringNote: "14 Leadership Principles are mandatory in every round alongside DSA.",
    roundStructure: [
      { n: 1, name: "Online Coding & LP Test", dur: "120 mins" },
      { n: 2, name: "Technical Interview 1", dur: "60 mins" },
      { n: 3, name: "Technical Interview 2", dur: "60 mins" },
      { n: 4, name: "Bar Raiser Round", dur: "60 mins" }
    ],
    topTopics: [
      { topic: "Trees & Heaps", pct: 80 },
      { topic: "Leadership Principles", pct: 95 },
      { topic: "System Design", pct: 45 }
    ]
  },
  {
    name: "Flipkart",
    slug: "flipkart",
    country: "India",
    tier: "Product",
    category: "product",
    successRate: "19.8%",
    avgSalary: "₹26 LPA",
    difficulty: "8.7/10",
    hiringStatus: "Active Hiring",
    avgProcess: "3-4 Weeks",
    hiringNote: "Machine Coding (LLD) round is an absolute eliminator.",
    roundStructure: [
      { n: 1, name: "Machine Coding (LLD)", dur: "120 mins" },
      { n: 2, name: "DSA Problem Solving", dur: "60 mins" },
      { n: 3, name: "System Architecture", dur: "60 mins" },
      { n: 4, name: "HM & Fitment", dur: "45 mins" }
    ],
    topTopics: [
      { topic: "Low Level Design (LLD)", pct: 90 },
      { topic: "Data Structures", pct: 75 },
      { topic: "DBMS & SQL", pct: 60 }
    ]
  }
];

// Dynamically clean slug time suffixes (e.g. -alltime, -1year, -2year) without hardcoded company lists
function getDynamicDomain(slug = "", name = "") {
  let raw = (slug || name).toLowerCase().trim();
  raw = raw.replace(/-(alltime|\d+year|\d+month|months|six-months)$/i, "").replace(/[^a-z0-9]/g, "");
  return raw ? `${raw}.com` : "";
}

// Dynamic normalization returning raw database fields directly
function normalizeCompany(c) {
  const dynamicDomain = getDynamicDomain(c.slug, c.name);
  const logo = c.logoUrl && c.logoUrl.trim()
    ? c.logoUrl.trim()
    : (dynamicDomain ? `https://www.google.com/s2/favicons?sz=128&domain=${dynamicDomain}` : null);

  const qCount = Array.isArray(c.topicFrequency)
    ? c.topicFrequency.reduce((acc, t) => acc + (t.questionCount || 0), 0)
    : c.questions;

  const topTopic = (Array.isArray(c.topicFrequency) && c.topicFrequency[0]?.topicName)
    || (Array.isArray(c.topTopics) && c.topTopics[0]?.topic)
    || c.topTopic;

  return {
    ...c,
    name: c.name,
    slug: c.slug,
    category: c.category || c.tier,
    type: c.category || c.tier,
    logoUrl: logo,
    avgSalaryLpa: c.avgSalaryLpa || c.avgSalary,
    avgSalary: c.avgSalaryLpa ? (c.avgSalaryLpa.startsWith("₹") ? c.avgSalaryLpa : `₹${c.avgSalaryLpa}`) : c.avgSalary,
    avgProcessWeeks: c.avgProcessWeeks || c.avgProcess,
    avgProcess: c.avgProcessWeeks || c.avgProcess,
    questions: qCount,
    topTopic,
    hiringStatus: c.hiringStatus,
    successRate: c.successRate,
  };
}

// GET /api/companies - List all companies with pagination & filtering
// Params: category (maang, product, service, startup), search, page, limit
router.get("/", async (req, res) => {
  const { category, search, page = 1, limit = 200 } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 200;
  const skip = (pageNum - 1) * limitNum;

  try {
    if (mongoose.connection.readyState === 1) {
      const filter = {};

      if (category && category !== "All") {
        filter.$or = [
          { category: new RegExp(`^${category}$`, "i") },
          { tier: new RegExp(`^${category}$`, "i") },
        ];
      }

      if (search) {
        const searchRegex = new RegExp(search, "i");
        filter.$and = [
          {
            $or: [
              { name: searchRegex },
              { slug: searchRegex },
              { tier: searchRegex },
              { category: searchRegex },
            ],
          },
        ];
      }

      const total = await Company.countDocuments(filter);
      const rawCompanies = await Company.find(filter).skip(skip).limit(limitNum).lean();

      if (rawCompanies && rawCompanies.length > 0) {
        const companies = rawCompanies.map(normalizeCompany);
        return res.json({
          success: true,
          count: companies.length,
          total,
          page: pageNum,
          totalPages: Math.ceil(total / limitNum) || 1,
          data: companies,
        });
      }
    }

    // Fallback mode
    let filtered = FALLBACK_COMPANIES.map(normalizeCompany);
    if (category && category !== "All") {
      filtered = filtered.filter(
        (c) =>
          (c.category && c.category.toLowerCase() === category.toLowerCase()) ||
          (c.tier && c.tier.toLowerCase() === category.toLowerCase())
      );
    }
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.toLowerCase().includes(search.toLowerCase())
      );
    }

    const paginated = filtered.slice(skip, skip + limitNum);

    return res.json({
      success: true,
      count: paginated.length,
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / limitNum) || 1,
      data: paginated,
    });
  } catch (error) {
    console.error("Error listing companies:", error);
    return res.status(500).json({ success: false, message: "Error retrieving companies" });
  }
});

// GET /api/companies/:slug - Get full company profile by slug
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  const targetSlug = slug.toLowerCase();

  try {
    let company = null;
    let sampleQuestions = [];

    if (mongoose.connection.readyState === 1) {
      const rawCompany = await Company.findOne({
        $or: [{ slug: targetSlug }, { name: new RegExp(`^${targetSlug}$`, "i") }],
      }).lean();

      if (rawCompany) {
        company = normalizeCompany(rawCompany);
        sampleQuestions = await Question.find({
          $or: [
            { companySlug: targetSlug },
            { company_slug: targetSlug },
            { companies: { $in: [targetSlug] } },
          ],
        })
          .limit(10)
          .lean();
      }
    }

    if (!company) {
      const fallbackRaw = FALLBACK_COMPANIES.find(
        (c) => c.slug === targetSlug || c.name.toLowerCase() === targetSlug
      );
      if (fallbackRaw) {
        company = normalizeCompany(fallbackRaw);
      }
    }

    if (!company) {
      return res.status(404).json({ success: false, message: `Company '${slug}' not found` });
    }

    return res.json({
      success: true,
      data: {
        ...company,
        sampleQuestions,
      },
    });
  } catch (error) {
    console.error(`Error fetching company '${slug}':`, error);
    return res.status(500).json({ success: false, message: "Error fetching company profile" });
  }
});

module.exports = router;
