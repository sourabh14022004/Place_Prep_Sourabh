const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("./config/db");
const Company = require("./models/Company");
const Question = require("./models/Question");
const User = require("./models/User");

const INITIAL_COMPANIES = [
  {
    name: "Google",
    slug: "google",
    country: "India",
    tier: "MAANG",
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
    name: "Microsoft",
    slug: "microsoft",
    country: "India",
    tier: "MAANG",
    successRate: "25.0%",
    avgSalary: "₹28 LPA",
    difficulty: "8.1/10",
    hiringStatus: "Active Hiring",
    avgProcess: "3-5 Weeks",
    hiringNote: "Focuses heavily on Clean Code, LLD, and Data Structures.",
    roundStructure: [
      { n: 1, name: "Online Assessment", dur: "90 mins" },
      { n: 2, name: "Technical Round 1", dur: "60 mins" },
      { n: 3, name: "Technical Round 2", dur: "60 mins" },
      { n: 4, name: "AA (As Appropriate) Round", dur: "60 mins" }
    ],
    topTopics: [
      { topic: "Arrays & LinkedLists", pct: 82 },
      { topic: "Trees & Graphs", pct: 75 },
      { topic: "Low Level Design", pct: 60 }
    ]
  },
  {
    name: "Flipkart",
    slug: "flipkart",
    country: "India",
    tier: "Product",
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
  },
  {
    name: "Razorpay",
    slug: "razorpay",
    country: "India",
    tier: "Startup",
    successRate: "15.5%",
    avgSalary: "₹24 LPA",
    difficulty: "8.4/10",
    hiringStatus: "Active Hiring",
    avgProcess: "2-3 Weeks",
    hiringNote: "Tests System Design, Webhooks, Idempotency, and API design.",
    roundStructure: [
      { n: 1, name: "Assignment / OA", dur: "90 mins" },
      { n: 2, name: "Technical Round 1", dur: "60 mins" },
      { n: 3, name: "System Design", dur: "60 mins" },
      { n: 4, name: "Culture & Leadership", dur: "45 mins" }
    ],
    topTopics: [
      { topic: "System Design", pct: 88 },
      { topic: "Webhooks & APIs", pct: 85 },
      { topic: "Data Structures", pct: 70 }
    ]
  },
  {
    name: "TCS",
    slug: "tcs",
    country: "India",
    tier: "Service",
    successRate: "65.0%",
    avgSalary: "₹7 LPA",
    difficulty: "4.5/10",
    hiringStatus: "Active Hiring",
    avgProcess: "1-2 Weeks",
    hiringNote: "Focuses on Aptitude (NQT), SQL, Core CS, and Basic Java/C++.",
    roundStructure: [
      { n: 1, name: "TCS NQT Test", dur: "180 mins" },
      { n: 2, name: "Technical Interview", dur: "30 mins" },
      { n: 3, name: "HR Interview", dur: "20 mins" }
    ],
    topTopics: [
      { topic: "Quantitative Aptitude", pct: 90 },
      { topic: "Core CS Fundamentals", pct: 85 },
      { topic: "SQL & DBMS", pct: 80 }
    ]
  }
];

const INITIAL_QUESTIONS = [
  {
    title: "Two Sum",
    topic: "Arrays",
    diff: "Easy",
    roundType: "Coding",
    companies: ["google", "amazon", "microsoft"],
    leetcodeUrl: "https://leetcode.com/problems/two-sum/",
    xp: 10,
    hot: true,
    frequency: 89,
    problemSummary: "Find two numbers that add up to target"
  },
  {
    title: "Merge Intervals",
    topic: "Arrays",
    diff: "Medium",
    roundType: "Coding",
    companies: ["google", "amazon"],
    leetcodeUrl: "https://leetcode.com/problems/merge-intervals/",
    xp: 25,
    hot: true,
    frequency: 76,
    problemSummary: "Merge overlapping intervals"
  },
  {
    title: "Word Search II",
    topic: "Trie & Backtracking",
    diff: "Hard",
    roundType: "Coding",
    companies: ["google"],
    leetcodeUrl: "https://leetcode.com/problems/word-search-ii/",
    xp: 40,
    hot: true,
    frequency: 65,
    problemSummary: "Find words in a 2D grid using Trie and Backtracking"
  },
  {
    title: "LRU Cache Implementation",
    topic: "Data Structures",
    diff: "Medium",
    roundType: "Coding",
    companies: ["amazon"],
    leetcodeUrl: "https://leetcode.com/problems/lru-cache/",
    xp: 25,
    hot: true,
    frequency: 82,
    problemSummary: "Design and implement a Least Recently Used (LRU) cache"
  },
  {
    title: "Design a Parking Lot",
    topic: "LLD",
    diff: "Medium",
    roundType: "LLD",
    companies: ["flipkart", "microsoft"],
    leetcodeUrl: null,
    xp: 50,
    hot: true,
    frequency: 68,
    problemSummary: "Low Level Design for parking lot management with Object Oriented Principles"
  },
  {
    title: "Design a Payment Gateway",
    topic: "System Design",
    diff: "Hard",
    roundType: "System Design",
    companies: ["razorpay"],
    leetcodeUrl: null,
    xp: 60,
    hot: true,
    frequency: 85,
    problemSummary: "Design high-reliability payment processing pipeline with webhook notifications"
  },
  {
    title: "Tell me about a time you owned something end-to-end",
    topic: "Behavioral",
    diff: "Medium",
    roundType: "HR",
    companies: ["amazon", "google"],
    leetcodeUrl: null,
    xp: 15,
    hot: true,
    frequency: 95,
    problemSummary: "Behavioral Leadership Principle: Ownership"
  },
  {
    title: "What is normalization?",
    topic: "DBMS",
    diff: "Easy",
    roundType: "Domain",
    companies: ["tcs"],
    leetcodeUrl: null,
    xp: 10,
    hot: true,
    frequency: 85,
    problemSummary: "DBMS 1NF, 2NF, 3NF, BCNF explanation"
  }
];

const INITIAL_USERS = [
  {
    name: "Aarav Sharma",
    email: "student@newtonschool.co",
    password: "student123",
    role: "student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav",
    department_or_batch: "CS Batch 2025 - NST",
    target_portal_url: "http://localhost:3000/dashboard"
  },
  {
    name: "Prof. Rajesh Kumar",
    email: "faculty@newtonschool.co",
    password: "faculty123",
    role: "faculty",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh",
    department_or_batch: "Department of Computer Science & Engineering",
    target_portal_url: "http://localhost:3001/"
  },
  {
    name: "Dr. Sunita Patel",
    email: "admin@newtonschool.co",
    password: "admin123",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sunita",
    department_or_batch: "Placement & Institutional Operations",
    target_portal_url: "http://localhost:3002/overview"
  }
];

const seedDB = async () => {
  try {
    const conn = await connectDB();
    if (!conn) {
      console.log("⚠️ Could not establish connection to MongoDB Atlas for seeding.");
      console.log("💡 Please ensure IP whitelist (0.0.0.0/0) is configured in MongoDB Atlas Network Access settings.");
      process.exit(0);
    }

    console.log("🧹 Clearing old database records...");
    await Company.deleteMany({});
    await Question.deleteMany({});
    await User.deleteMany({});

    console.log("🌱 Inserting initial companies...");
    const createdCompanies = await Company.insertMany(INITIAL_COMPANIES);
    console.log(`✅ Seeded ${createdCompanies.length} companies into MongoDB Atlas.`);

    console.log("🌱 Inserting practice questions...");
    const createdQuestions = await Question.insertMany(INITIAL_QUESTIONS);
    console.log(`✅ Seeded ${createdQuestions.length} questions into MongoDB Atlas.`);

    console.log("🌱 Inserting demo portal users...");
    const createdUsers = await User.insertMany(INITIAL_USERS);
    console.log(`✅ Seeded ${createdUsers.length} user profiles into MongoDB Atlas.`);

    console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database seeding failed:", error.message);
    process.exit(0);
  }
};

seedDB();
