/**
 * backend/src/scripts/seed.ts
 * Full database seed — wipes seeded data and repopulates with realistic NST data.
 * Run: cd backend && npm run seed
 * Reset: cd backend && npm run seed:reset
 *
 * All seeded documents carry isSeeded: true — safe to wipe without touching real data.
 * Scale: Designed for 5,000+ user environments. Uses bulk insertMany for performance.
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import { hashPassword } from '../utils/password';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import FacultyProfile from '../models/FacultyProfile';
import Company, { ICompany } from '../models/Company';
import Question, { IQuestion } from '../models/Question';
import UserRoadmap from '../models/UserRoadmap';
import QuestionCompletion from '../models/QuestionCompletion';
import DoubtThread from '../models/DoubtThread';
import SessionBooking from '../models/SessionBooking';
import Notification from '../models/Notification';
import InterviewExperience from '../models/InterviewExperience';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placeprep';
const RESET_MODE = process.argv.includes('--reset');

async function clearSeeded() {
  console.log('  Clearing seeded data...');
  await Promise.all([
    User.deleteMany({ isSeeded: true }),
    StudentProfile.deleteMany({ isSeeded: true }),
    FacultyProfile.deleteMany({ isSeeded: true }),
    Company.deleteMany({ isSeeded: true }),
    Question.deleteMany({ isSeeded: true }),
    UserRoadmap.deleteMany({ isSeeded: true }),
    QuestionCompletion.deleteMany({ isSeeded: true }),
    DoubtThread.deleteMany({ isSeeded: true }),
    SessionBooking.deleteMany({ isSeeded: true }),
    Notification.deleteMany({ isSeeded: true }),
    InterviewExperience.deleteMany({ isSeeded: true }),
  ]);
  console.log('  Cleared all seeded data.\n');

  if (RESET_MODE) {
    console.log('Reset-only mode. Exiting.');
    await mongoose.disconnect();
    process.exit(0);
  }
}

// ─── COMPANIES ────────────────────────────────────────────────────────────────
const COMPANIES = [
  {
    name: 'Google', slug: 'google', logoUrl: '/logos/google.svg',
    category: 'maang', hiringStatus: 'Active Hiring', tier: 'T1', country: 'USA',
    avgSalaryLpa: '40-60 LPA', avgProcessWeeks: '6-8 weeks',
    hiringNote: 'Competitive — strong DSA and system design required', successRate: '12%',
    roundStructure: [
      { roundNumber: 1, roundName: 'Online Assessment', roundType: 'Coding', typicalDurationMin: 90, description: '2 LeetCode medium/hard in 90 min' },
      { roundNumber: 2, roundName: 'Technical Phone Screen', roundType: 'Coding', typicalDurationMin: 45, description: 'DSA problem solving' },
      { roundNumber: 3, roundName: 'Virtual Onsite — System Design', roundType: 'System Design', typicalDurationMin: 60, description: 'Design a large-scale system' },
      { roundNumber: 4, roundName: 'Googleyness', roundType: 'HR', typicalDurationMin: 45, description: 'Behavioral and culture fit' },
    ],
    topicFrequency: [
      { topicSlug: 'arrays-strings', topicName: 'Arrays & Strings', frequencyPct: 33, questionCount: 45 },
      { topicSlug: 'dynamic-programming', topicName: 'Dynamic Programming', frequencyPct: 28, questionCount: 38 },
      { topicSlug: 'graphs-trees', topicName: 'Graphs & Trees', frequencyPct: 24, questionCount: 32 },
      { topicSlug: 'system-design', topicName: 'System Design', frequencyPct: 15, questionCount: 20 },
    ],
    difficultyDistribution: { Easy: 20, Medium: 55, Hard: 25 },
    isSeeded: true,
  },
  {
    name: 'Microsoft', slug: 'microsoft', logoUrl: '/logos/microsoft.svg',
    category: 'maang', hiringStatus: 'Active Hiring', tier: 'T1', country: 'USA',
    avgSalaryLpa: '35-52 LPA', avgProcessWeeks: '4-6 weeks',
    hiringNote: 'Emphasis on LLD and system design in later rounds', successRate: '15%',
    roundStructure: [
      { roundNumber: 1, roundName: 'Online Assessment', roundType: 'Coding', typicalDurationMin: 90, description: 'DSA problems on HackerRank' },
      { roundNumber: 2, roundName: 'Technical Round 1', roundType: 'Coding', typicalDurationMin: 60, description: 'Data structures + discussion' },
      { roundNumber: 3, roundName: 'LLD Round', roundType: 'LLD', typicalDurationMin: 60, description: 'Low-level system design' },
      { roundNumber: 4, roundName: 'System Design', roundType: 'System Design', typicalDurationMin: 60, description: 'Distributed systems design' },
    ],
    topicFrequency: [
      { topicSlug: 'arrays-strings', topicName: 'Arrays & Strings', frequencyPct: 37, questionCount: 40 },
      { topicSlug: 'trees-graphs', topicName: 'Trees & Graphs', frequencyPct: 33, questionCount: 35 },
      { topicSlug: 'lld', topicName: 'LLD', frequencyPct: 17, questionCount: 18 },
      { topicSlug: 'system-design', topicName: 'System Design', frequencyPct: 13, questionCount: 15 },
    ],
    difficultyDistribution: { Easy: 25, Medium: 50, Hard: 25 },
    isSeeded: true,
  },
  {
    name: 'Amazon', slug: 'amazon', logoUrl: '/logos/amazon.svg',
    category: 'maang', hiringStatus: 'Active Hiring', tier: 'T1', country: 'USA',
    avgSalaryLpa: '28-50 LPA', avgProcessWeeks: '4-5 weeks',
    hiringNote: 'Leadership principles are heavily tested across all rounds', successRate: '18%',
    roundStructure: [
      { roundNumber: 1, roundName: 'Online Assessment', roundType: 'Coding', typicalDurationMin: 90, description: 'DSA + work simulation test' },
      { roundNumber: 2, roundName: 'Technical + LP', roundType: 'Coding', typicalDurationMin: 60, description: 'DSA + leadership principle stories' },
      { roundNumber: 3, roundName: 'System Design', roundType: 'System Design', typicalDurationMin: 60, description: 'High-scale distributed system' },
    ],
    topicFrequency: [
      { topicSlug: 'arrays-strings', topicName: 'Arrays & Strings', frequencyPct: 38, questionCount: 50 },
      { topicSlug: 'linked-list-stack', topicName: 'Linked List & Stack', frequencyPct: 21, questionCount: 28 },
      { topicSlug: 'leadership-principles', topicName: 'Leadership Principles', frequencyPct: 23, questionCount: 30 },
      { topicSlug: 'system-design', topicName: 'System Design', frequencyPct: 17, questionCount: 22 },
    ],
    difficultyDistribution: { Easy: 20, Medium: 50, Hard: 30 },
    isSeeded: true,
  },
  {
    name: 'Flipkart', slug: 'flipkart', logoUrl: '/logos/flipkart.svg',
    category: 'product', hiringStatus: 'Active Hiring', tier: 'T2', country: 'India',
    avgSalaryLpa: '22-38 LPA', avgProcessWeeks: '3-4 weeks',
    hiringNote: 'Strong focus on problem-solving and LLD', successRate: '22%',
    roundStructure: [
      { roundNumber: 1, roundName: 'Online Assessment', roundType: 'Coding', typicalDurationMin: 90, description: 'DSA problems' },
      { roundNumber: 2, roundName: 'Technical Round', roundType: 'Coding', typicalDurationMin: 60, description: 'DSA + discussion' },
      { roundNumber: 3, roundName: 'LLD Round', roundType: 'LLD', typicalDurationMin: 60, description: 'Design a system at class level' },
    ],
    topicFrequency: [
      { topicSlug: 'arrays-strings', topicName: 'Arrays & Strings', frequencyPct: 43, questionCount: 35 },
      { topicSlug: 'dynamic-programming', topicName: 'Dynamic Programming', frequencyPct: 31, questionCount: 25 },
      { topicSlug: 'lld', topicName: 'LLD', frequencyPct: 25, questionCount: 20 },
    ],
    difficultyDistribution: { Easy: 20, Medium: 55, Hard: 25 },
    isSeeded: true,
  },
  {
    name: 'Infosys', slug: 'infosys', logoUrl: '/logos/infosys.svg',
    category: 'service', hiringStatus: 'Active Hiring', tier: 'T3', country: 'India',
    avgSalaryLpa: '5-12 LPA', avgProcessWeeks: '2-3 weeks',
    hiringNote: 'High volume hiring — aptitude and communication are key', successRate: '48%',
    roundStructure: [
      { roundNumber: 1, roundName: 'Online Test', roundType: 'Aptitude', typicalDurationMin: 120, description: 'Aptitude + reasoning + coding' },
      { roundNumber: 2, roundName: 'Technical Interview', roundType: 'Coding', typicalDurationMin: 45, description: 'DSA basics + DBMS' },
      { roundNumber: 3, roundName: 'HR Round', roundType: 'HR', typicalDurationMin: 30, description: 'Communication + role fit' },
    ],
    topicFrequency: [
      { topicSlug: 'arrays-strings', topicName: 'Arrays & Strings', frequencyPct: 33, questionCount: 20 },
      { topicSlug: 'dbms', topicName: 'DBMS', frequencyPct: 25, questionCount: 15 },
      { topicSlug: 'aptitude', topicName: 'Aptitude', frequencyPct: 42, questionCount: 25 },
    ],
    difficultyDistribution: { Easy: 60, Medium: 35, Hard: 5 },
    isSeeded: true,
  },
  {
    name: 'Razorpay', slug: 'razorpay', logoUrl: '/logos/razorpay.svg',
    category: 'startup', hiringStatus: 'Active Hiring', tier: 'T2', country: 'India',
    avgSalaryLpa: '18-30 LPA', avgProcessWeeks: '3-4 weeks',
    hiringNote: 'Fintech focus — backend systems and API design matter', successRate: '20%',
    roundStructure: [
      { roundNumber: 1, roundName: 'Coding Round', roundType: 'Coding', typicalDurationMin: 90, description: 'DSA + backend design' },
      { roundNumber: 2, roundName: 'System Design', roundType: 'System Design', typicalDurationMin: 60, description: 'Payment system design' },
      { roundNumber: 3, roundName: 'Culture Fit', roundType: 'HR', typicalDurationMin: 30, description: 'Values and culture fit' },
    ],
    topicFrequency: [
      { topicSlug: 'backend-apis', topicName: 'Backend APIs', frequencyPct: 40, questionCount: 28 },
      { topicSlug: 'system-design', topicName: 'System Design', frequencyPct: 29, questionCount: 20 },
      { topicSlug: 'dsa', topicName: 'DSA', frequencyPct: 31, questionCount: 22 },
    ],
    difficultyDistribution: { Easy: 15, Medium: 55, Hard: 30 },
    isSeeded: true,
  },
  {
    name: 'TCS', slug: 'tcs', logoUrl: '/logos/tcs.svg',
    category: 'service', hiringStatus: 'Active Hiring', tier: 'T3', country: 'India',
    avgSalaryLpa: '4-8 LPA', avgProcessWeeks: '2-3 weeks',
    hiringNote: 'Large-scale mass hiring — aptitude and communication critical', successRate: '55%',
    roundStructure: [
      { roundNumber: 1, roundName: 'TCS NQT', roundType: 'Aptitude', typicalDurationMin: 90, description: 'Quantitative + verbal + reasoning' },
      { roundNumber: 2, roundName: 'Technical Interview', roundType: 'Coding', typicalDurationMin: 30, description: 'Basic CS + project discussion' },
      { roundNumber: 3, roundName: 'HR Round', roundType: 'HR', typicalDurationMin: 20, description: 'Communication and culture fit' },
    ],
    topicFrequency: [
      { topicSlug: 'aptitude', topicName: 'Aptitude', frequencyPct: 50, questionCount: 40 },
      { topicSlug: 'dbms', topicName: 'DBMS', frequencyPct: 25, questionCount: 20 },
      { topicSlug: 'os', topicName: 'OS', frequencyPct: 25, questionCount: 20 },
    ],
    difficultyDistribution: { Easy: 70, Medium: 25, Hard: 5 },
    isSeeded: true,
  },
  {
    name: 'Wipro', slug: 'wipro', logoUrl: '/logos/wipro.svg',
    category: 'service', hiringStatus: 'Slow Hiring', tier: 'T3', country: 'India',
    avgSalaryLpa: '4-7 LPA', avgProcessWeeks: '2-3 weeks',
    hiringNote: 'WILP program available for B.Tech graduates', successRate: '50%',
    roundStructure: [
      { roundNumber: 1, roundName: 'Online Test', roundType: 'Aptitude', typicalDurationMin: 60, description: 'Aptitude + English' },
      { roundNumber: 2, roundName: 'Technical Interview', roundType: 'Coding', typicalDurationMin: 30, description: 'CS fundamentals' },
      { roundNumber: 3, roundName: 'HR Round', roundType: 'HR', typicalDurationMin: 20, description: 'HR questions' },
    ],
    topicFrequency: [
      { topicSlug: 'aptitude', topicName: 'Aptitude', frequencyPct: 55, questionCount: 35 },
      { topicSlug: 'cn', topicName: 'Computer Networks', frequencyPct: 25, questionCount: 18 },
      { topicSlug: 'os', topicName: 'OS', frequencyPct: 20, questionCount: 15 },
    ],
    difficultyDistribution: { Easy: 65, Medium: 30, Hard: 5 },
    isSeeded: true,
  },
  {
    name: 'Zomato', slug: 'zomato', logoUrl: '/logos/zomato.svg',
    category: 'startup', hiringStatus: 'Active Hiring', tier: 'T2', country: 'India',
    avgSalaryLpa: '15-28 LPA', avgProcessWeeks: '3-4 weeks',
    hiringNote: 'Fast-paced — problem-solving speed and data structures focus', successRate: '18%',
    roundStructure: [
      { roundNumber: 1, roundName: 'Online Coding', roundType: 'Coding', typicalDurationMin: 90, description: 'DSA problems' },
      { roundNumber: 2, roundName: 'Technical Interview', roundType: 'Coding', typicalDurationMin: 60, description: 'DSA + product thinking' },
      { roundNumber: 3, roundName: 'Culture Fit', roundType: 'HR', typicalDurationMin: 30, description: 'Culture and values' },
    ],
    topicFrequency: [
      { topicSlug: 'arrays-strings', topicName: 'Arrays & Strings', frequencyPct: 45, questionCount: 30 },
      { topicSlug: 'dynamic-programming', topicName: 'Dynamic Programming', frequencyPct: 30, questionCount: 20 },
      { topicSlug: 'graphs', topicName: 'Graphs', frequencyPct: 25, questionCount: 18 },
    ],
    difficultyDistribution: { Easy: 20, Medium: 50, Hard: 30 },
    isSeeded: true,
  },
  {
    name: 'Salesforce', slug: 'salesforce', logoUrl: '/logos/salesforce.svg',
    category: 'product', hiringStatus: 'Active Hiring', tier: 'T2', country: 'USA',
    avgSalaryLpa: '25-45 LPA', avgProcessWeeks: '4-6 weeks',
    hiringNote: 'Focus on OOP, Java, Apex, and system design', successRate: '20%',
    roundStructure: [
      { roundNumber: 1, roundName: 'Hackerrank Test', roundType: 'Coding', typicalDurationMin: 90, description: 'DSA + debugging' },
      { roundNumber: 2, roundName: 'Technical Interview 1', roundType: 'Coding', typicalDurationMin: 60, description: 'OOP + data structures' },
      { roundNumber: 3, roundName: 'System Design', roundType: 'System Design', typicalDurationMin: 60, description: 'CRM system design' },
      { roundNumber: 4, roundName: 'HR + Culture', roundType: 'HR', typicalDurationMin: 30, description: 'Values and culture fit' },
    ],
    topicFrequency: [
      { topicSlug: 'oop', topicName: 'OOP', frequencyPct: 35, questionCount: 25 },
      { topicSlug: 'arrays-strings', topicName: 'Arrays & Strings', frequencyPct: 30, questionCount: 22 },
      { topicSlug: 'system-design', topicName: 'System Design', frequencyPct: 35, questionCount: 25 },
    ],
    difficultyDistribution: { Easy: 20, Medium: 55, Hard: 25 },
    isSeeded: true,
  },
];

// ─── QUESTIONS PER COMPANY ────────────────────────────────────────────────────
function makeQuestions(companyId: mongoose.Types.ObjectId, companySlug: string, companyName: string) {
  return [
    {
      companyId, companySlug, companyName,
      problemSummary: 'Find two numbers in an array that add up to a target sum.',
      topics: ['Arrays & Strings', 'Hash Map'],
      difficulty: 'Easy', roundType: 'Coding',
      frequencyScore: 0.95, isHot: true, xpValue: 10, verified: true,
      leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
      isSeeded: true,
    },
    {
      companyId, companySlug, companyName,
      problemSummary: 'Given a binary tree, find its maximum depth.',
      topics: ['Graphs & Trees', 'DFS'],
      difficulty: 'Easy', roundType: 'Coding',
      frequencyScore: 0.85, isHot: false, xpValue: 10, verified: true,
      leetcodeUrl: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
      isSeeded: true,
    },
    {
      companyId, companySlug, companyName,
      problemSummary: 'Implement LRU Cache with O(1) get and put operations.',
      topics: ['Design', 'Linked List', 'Hash Map'],
      difficulty: 'Medium', roundType: 'Coding',
      frequencyScore: 0.92, isHot: true, xpValue: 25, verified: true,
      leetcodeUrl: 'https://leetcode.com/problems/lru-cache/',
      isSeeded: true,
    },
    {
      companyId, companySlug, companyName,
      problemSummary: 'Merge K sorted linked lists into one sorted list.',
      topics: ['Linked List', 'Heap', 'Divide & Conquer'],
      difficulty: 'Hard', roundType: 'Coding',
      frequencyScore: 0.78, isHot: false, xpValue: 50, verified: true,
      leetcodeUrl: 'https://leetcode.com/problems/merge-k-sorted-lists/',
      isSeeded: true,
    },
    {
      companyId, companySlug, companyName,
      problemSummary: 'Design a URL shortener like bit.ly. Handle 100M URLs per day.',
      topics: ['System Design', 'Hashing', 'Database'],
      difficulty: 'Medium', roundType: 'System Design',
      frequencyScore: 0.88, isHot: true, xpValue: 25, verified: true,
      isSeeded: true,
    },
    {
      companyId, companySlug, companyName,
      problemSummary: 'Find the longest substring without repeating characters.',
      topics: ['Arrays & Strings', 'Sliding Window'],
      difficulty: 'Medium', roundType: 'Coding',
      frequencyScore: 0.90, isHot: true, xpValue: 25, verified: true,
      leetcodeUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      isSeeded: true,
    },
    {
      companyId, companySlug, companyName,
      problemSummary: 'Given n nodes in a graph, find if there is a path between two nodes.',
      topics: ['Graphs & Trees', 'BFS', 'DFS'],
      difficulty: 'Medium', roundType: 'Coding',
      frequencyScore: 0.82, isHot: false, xpValue: 25, verified: true,
      leetcodeUrl: 'https://leetcode.com/problems/find-if-path-exists-in-graph/',
      isSeeded: true,
    },
    {
      companyId, companySlug, companyName,
      problemSummary: 'Normalize a database schema to 3NF. Given a set of functional dependencies, identify and fix violations.',
      topics: ['DBMS', 'Normalization'],
      difficulty: 'Medium', roundType: 'Coding',
      frequencyScore: 0.70, isHot: false, xpValue: 25, verified: true,
      isSeeded: true,
    },
    {
      companyId, companySlug, companyName,
      problemSummary: 'Write a SQL query to find the second highest salary from an Employee table.',
      topics: ['DBMS', 'SQL'],
      difficulty: 'Easy', roundType: 'Coding',
      frequencyScore: 0.88, isHot: true, xpValue: 10, verified: true,
      leetcodeUrl: 'https://leetcode.com/problems/second-highest-salary/',
      isSeeded: true,
    },
    {
      companyId, companySlug, companyName,
      problemSummary: 'Explain what happens when you type a URL in the browser and press Enter.',
      topics: ['CN', 'DNS', 'HTTP'],
      difficulty: 'Easy', roundType: 'Coding',
      frequencyScore: 0.75, isHot: false, xpValue: 10, verified: true,
      isSeeded: true,
    },
  ];
}

// ─── STUDENTS (10) ────────────────────────────────────────────────────────────
const STUDENT_SEEDS = [
  { name: 'Arjun Mehta',    email: 'arjun.mehta@newtonschool.co',    batch: '2024', branch: 'CS & AI', year: '3rd', xp: 1240, streak: 14, status: 'IN_PROGRESS', targets: ['google', 'microsoft', 'amazon'] },
  { name: 'Priya Sharma',   email: 'priya.sharma@newtonschool.co',   batch: '2024', branch: 'CS & AI', year: '3rd', xp: 980,  streak: 7,  status: 'IN_PROGRESS', targets: ['flipkart', 'zomato', 'razorpay'] },
  { name: 'Rohan Das',      email: 'rohan.das@newtonschool.co',      batch: '2025', branch: 'CS & AI', year: '2nd', xp: 650,  streak: 3,  status: 'IN_PROGRESS', targets: ['tcs', 'infosys', 'wipro'] },
  { name: 'Ankita Singh',   email: 'ankita.singh@newtonschool.co',   batch: '2024', branch: 'CS & AI', year: '3rd', xp: 1850, streak: 22, status: 'PLACED',       targets: ['google', 'amazon', 'salesforce'] },
  { name: 'Saurav Kumar',   email: 'saurav.kumar@newtonschool.co',   batch: '2025', branch: 'CS & AI', year: '2nd', xp: 420,  streak: 2,  status: 'IN_PROGRESS', targets: ['wipro', 'tcs', 'infosys'] },
  { name: 'Divya Nair',     email: 'divya.nair@newtonschool.co',     batch: '2026', branch: 'CS & AI', year: '1st', xp: 150,  streak: 1,  status: 'INACTIVE',     targets: ['infosys', 'wipro'] },
  { name: 'Karan Verma',    email: 'karan.verma@newtonschool.co',    batch: '2024', branch: 'CS & AI', year: '3rd', xp: 1100, streak: 9,  status: 'IN_PROGRESS', targets: ['microsoft', 'amazon', 'flipkart'] },
  { name: 'Sneha Patel',    email: 'sneha.patel@newtonschool.co',    batch: '2025', branch: 'CS & AI', year: '2nd', xp: 760,  streak: 5,  status: 'IN_PROGRESS', targets: ['zomato', 'razorpay', 'flipkart'] },
  { name: 'Rahul Gupta',    email: 'rahul.gupta@newtonschool.co',    batch: '2024', branch: 'CS & AI', year: '3rd', xp: 2100, streak: 30, status: 'PLACED',       targets: ['google', 'microsoft', 'salesforce'] },
  { name: 'Nisha Agarwal',  email: 'nisha.agarwal@newtonschool.co',  batch: '2025', branch: 'CS & AI', year: '2nd', xp: 540,  streak: 4,  status: 'IN_PROGRESS', targets: ['amazon', 'flipkart', 'tcs'] },
];

// ─── FACULTY (10) ─────────────────────────────────────────────────────────────
// doubtDomains drives doubt routing (admin-editable later via Manage Faculty).
// Every domain gets at least two faculty so no domain falls back to notifying
// everyone; a few carry a second domain where their subject spans both.
const FACULTY_SEEDS = [
  { name: 'Dr. Priya Nair',       email: 'priya.nair@newtonschool.co',       subject: 'Data Structures & Algorithms', initials: 'PN', stream: 'Computer Science',      doubtDomains: ['DSA'] },
  { name: 'Prof. Rajesh Kumar',   email: 'rajesh.kumar@newtonschool.co',    subject: 'System Design',                 initials: 'RK', stream: 'Software Engineering', doubtDomains: ['System Design'] },
  { name: 'Dr. Meera Singh',      email: 'meera.singh@newtonschool.co',     subject: 'Database Management',           initials: 'MS', stream: 'Computer Science',      doubtDomains: ['System Design', 'Web Development'] },
  { name: 'Prof. Amit Sharma',    email: 'amit.sharma@newtonschool.co',     subject: 'Operating Systems',             initials: 'AS', stream: 'Systems',               doubtDomains: ['LLD', 'General'] },
  { name: 'Dr. Kavita Rao',       email: 'kavita.rao@newtonschool.co',      subject: 'Computer Networks',             initials: 'KR', stream: 'Networking',            doubtDomains: ['Web Development', 'General'] },
  { name: 'Prof. Suresh Menon',   email: 'suresh.menon@newtonschool.co',    subject: 'Dynamic Programming',           initials: 'SM', stream: 'Computer Science',      doubtDomains: ['DSA'] },
  { name: 'Dr. Ananya Ghosh',     email: 'ananya.ghosh@newtonschool.co',    subject: 'Machine Learning',              initials: 'AG', stream: 'AI & ML',               doubtDomains: ['Aptitude'] },
  { name: 'Prof. Vikram Desai',   email: 'vikram.desai@newtonschool.co',    subject: 'Low Level Design',              initials: 'VD', stream: 'Software Engineering', doubtDomains: ['LLD'] },
  { name: 'Dr. Pooja Srivastava', email: 'pooja.srivastava@newtonschool.co', subject: 'Aptitude & Reasoning',        initials: 'PS', stream: 'Quantitative',          doubtDomains: ['Aptitude', 'HR'] },
  { name: 'Prof. Ravi Tiwari',    email: 'ravi.tiwari@newtonschool.co',     subject: 'Interview Preparation',         initials: 'RT', stream: 'Soft Skills',           doubtDomains: ['HR'] },
];

// Helper to generate a random date in the past N days
function daysAgo(n: number): Date {
  return new Date(Date.now() - Math.floor(Math.random() * n * 24 * 60 * 60 * 1000));
}

// ─── MAIN SEED ─────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  await clearSeeded();

  // ── Admin (permanent — not seeded, skip if exists) ──
  console.log('Seeding admin...');
  const existingAdmin = await User.findOne({ email: 'admin@newtonschool.co' });
  if (!existingAdmin) {
    await User.create({
      email: 'admin@newtonschool.co',
      passwordHash: await hashPassword('Admin@NST2024'),
      role: 'admin',
      isSeeded: false,
    });
    console.log('  Admin created: admin@newtonschool.co / Admin@NST2024');
  } else {
    console.log('  Admin already exists, skipped.');
  }

  // ── Faculty (10) ──
  console.log('\nSeeding faculty...');
  const facultyUserIds: mongoose.Types.ObjectId[] = [];
  const facultyProfileIds: mongoose.Types.ObjectId[] = [];
  const facultyNameMap = new Map<string, string>(); // userId → name

  for (const f of FACULTY_SEEDS) {
    const user = await User.create({
      email: f.email,
      passwordHash: await hashPassword('Faculty@2024'),
      role: 'faculty',
      isSeeded: true,
    });
    const profile = await FacultyProfile.create({
      userId: user._id,
      fullName: f.name,
      initials: f.initials,
      subject: f.subject,
      stream: f.stream,
      doubtDomains: f.doubtDomains,
      status: 'ACTIVE',
      acceptCount: Math.floor(Math.random() * 30) + 5,
      declineCount: Math.floor(Math.random() * 5),
      satisfactionAvg: +(3.5 + Math.random() * 1.5).toFixed(1),
      responseRate: Math.floor(75 + Math.random() * 25),
      isSeeded: true,
    });
    facultyUserIds.push(user._id as mongoose.Types.ObjectId);
    facultyProfileIds.push(profile._id as mongoose.Types.ObjectId);
    facultyNameMap.set((user._id as mongoose.Types.ObjectId).toString(), f.name);
    console.log(`  Created faculty: ${f.email} / Faculty@2024`);
  }

  // ── Companies (10) ──
  console.log('\nSeeding companies...');
  const companyDocs: ICompany[] = [];
  for (const c of COMPANIES) {
    const doc = await Company.create(c as any);
    companyDocs.push(doc.toObject() as ICompany);
  }
  console.log(`  Created ${companyDocs.length} companies.`);

  // ── Questions (10 per company = 100 total) ──
  console.log('\nSeeding questions...');
  const allQuestions: IQuestion[] = [];
  for (const company of companyDocs) {
    const qs = makeQuestions(company._id as mongoose.Types.ObjectId, company.slug, company.name);
    const created = await Question.insertMany(qs);
    allQuestions.push(...(created as unknown as IQuestion[]));
  }
  console.log(`  Created ${allQuestions.length} questions.`);

  const googleCompany  = companyDocs.find(c => c.slug === 'google')!;
  const microsoftComp  = companyDocs.find(c => c.slug === 'microsoft')!;

  // ── Students (10) ──
  console.log('\nSeeding students...');
  const studentUserIds: mongoose.Types.ObjectId[] = [];

  for (const [idx, s] of STUDENT_SEEDS.entries()) {
    const user = await User.create({
      email: s.email,
      passwordHash: await hashPassword('Student@2024'),
      role: 'student',
      isSeeded: true,
    });
    const uid = user._id as mongoose.Types.ObjectId;
    studentUserIds.push(uid);

    await StudentProfile.create({
      userId: uid,
      fullName: s.name,
      batch: s.batch,
      branch: s.branch,
      year: s.year as any,
      xpTotal: s.xp,
      currentStreakDays: s.streak,
      onboardingComplete: true,
      placementStatus: s.status as any,
      placedCompany: s.status === 'PLACED' ? (idx === 3 ? 'Google' : 'Microsoft') : undefined,
      targetCompanySlugs: s.targets,
      targetCategories: ['maang', 'product', 'service'].slice(0, 2),
      prepWeeksCommitted: 12,
      lastActiveAt: daysAgo(idx % 3),
      isSeeded: true,
    });

    // Roadmap (Google)
    await UserRoadmap.create({
      studentId: uid,
      companyId: googleCompany._id,
      companySlug: 'google',
      companyName: 'Google',
      roleName: 'Software Engineer',
      weeksCommitted: 12,
      currentWeek: Math.min(idx + 1, 12),
      pctComplete: Math.min(Math.round(s.xp / 20), 95),
      isActive: true,
      weeks: googleCompany.topicFrequency.slice(0, 4).map((tf, i) => ({
        weekNumber: i + 1,
        topicLabel: tf.topicName,
        totalQuestions: 5,
        doneQuestions: i < idx % 4 ? 5 : i === idx % 4 ? 2 : 0,
        status: i < idx % 4 ? 'done' : i === idx % 4 ? 'active' : 'locked',
      })),
      isSeeded: true,
    });

    // Question completions — spread over past 30 days for analytics charts
    const completionBatch = [];
    const numCompletions = Math.floor(s.xp / 100) + 2; // more XP = more completions
    for (let c = 0; c < Math.min(numCompletions, allQuestions.length); c++) {
      const q = allQuestions[c] as any;
      completionBatch.push({
        studentId: uid,
        questionId: q._id,
        companySlug: q.companySlug,
        difficulty: q.difficulty,
        xpEarned: q.xpValue,
        completedAt: daysAgo(Math.floor(Math.random() * 30)),
        isSeeded: true,
      });
    }
    if (completionBatch.length > 0) {
      await QuestionCompletion.insertMany(completionBatch);
    }

    // Doubt thread per student (varied statuses/tags)
    const tags = ['DSA', 'System Design', 'LLD', 'HR', 'General', 'Aptitude'];
    const doubtsPerStudent = idx < 5 ? 2 : 1;
    for (let d = 0; d < doubtsPerStudent; d++) {
      const assignedFaculty = facultyUserIds[d % facultyUserIds.length];
      const assignedName = facultyNameMap.get(assignedFaculty.toString()) ?? 'Faculty';
      const tag = tags[(idx + d) % tags.length];
      const status = idx % 3 === 0 ? 'pending' : idx % 3 === 1 ? 'answered' : 'resolved';
      await DoubtThread.create({
        studentId: uid,
        studentName: s.name,
        assignedFacultyId: assignedFaculty,
        subject: `Struggling with ${tag} concepts for placement`,
        body: `I need help understanding ${tag}. Can you suggest a structured approach?`,
        tag,
        status,
        replies: status !== 'pending'
          ? [{
              authorId: assignedFaculty,
              authorName: assignedName,
              authorRole: 'faculty',
              body: `Great question! Start with fundamentals, then move to practice problems. I'll share a structured plan.`,
              sentAt: daysAgo(Math.floor(Math.random() * 7)),
            }]
          : [],
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
        isSeeded: true,
      });
    }

    // Notifications per student
    await Notification.insertMany([
      { userId: uid, type: 'xp', title: '+100 XP — Onboarding Complete', subtitle: 'Your roadmap is ready. Start with week 1.', iconName: 'Zap', isRead: false, isSeeded: true },
      { userId: uid, type: 'new_company', title: 'Google is Actively Hiring', subtitle: '3 new roles added for 2024 batch.', iconName: 'Building', isRead: true, isSeeded: true },
      { userId: uid, type: 'session', title: 'Session Confirmed', subtitle: `Your 1:1 with ${FACULTY_SEEDS[0].name} is set for tomorrow 2 PM.`, iconName: 'Calendar', isRead: false, isSeeded: true },
    ]);

    console.log(`  Created student: ${s.email} / Student@2024 (${s.xp} XP, ${s.status})`);
  }

  // ── Interview Experiences (multiple) ──
  console.log('\nSeeding interview experiences...');
  const expData = [
    { sIdx: 0, slug: 'google', outcome: 'offer', role: 'Software Engineer', difficulty: 'Hard', rounds: 4 },
    { sIdx: 3, slug: 'google', outcome: 'offer', role: 'SWE Intern → Full Time', difficulty: 'Hard', rounds: 4 },
    { sIdx: 8, slug: 'microsoft', outcome: 'offer', role: 'Software Engineer 2', difficulty: 'Medium', rounds: 3 },
    { sIdx: 1, slug: 'flipkart', outcome: 'rejected', role: 'SDE-1', difficulty: 'Medium', rounds: 2 },
    { sIdx: 4, slug: 'tcs', outcome: 'offer', role: 'Systems Engineer', difficulty: 'Easy', rounds: 3 },
  ];

  for (const exp of expData) {
    const student = await User.findOne({ email: STUDENT_SEEDS[exp.sIdx].email });
    const company = companyDocs.find(c => c.slug === exp.slug);
    if (!student || !company) continue;

    await InterviewExperience.create({
      studentId: student._id,
      studentName: STUDENT_SEEDS[exp.sIdx].name,
      companyId: company._id,
      companySlug: exp.slug,
      companyName: company.name,
      role: exp.role,
      interviewDate: daysAgo(Math.floor(Math.random() * 180) + 30),
      outcome: exp.outcome,
      overallDifficulty: exp.difficulty,
      roundsCount: exp.rounds,
      rounds: Array.from({ length: exp.rounds }, (_, i) => ({
        roundNumber: i + 1,
        type: ['Online Assessment', 'Technical Interview', 'System Design', 'HR'][i] ?? 'Technical',
        topics: ['Arrays', 'Trees', 'System Design', 'HR'][i] ? [['Arrays', 'Trees', 'System Design', 'HR'][i]] : ['DSA'],
        description: 'Standard round as described by company.',
        cleared: exp.outcome === 'offer' || i < exp.rounds - 1,
      })),
      experienceText: `Preparation took ${Math.floor(Math.random() * 8) + 4} weeks of dedicated practice. Focus on patterns, not memorizing solutions. The interviewers were friendly and guided me when I got stuck. Time management during coding rounds was critical.`,
      tips: 'Practice consistently every day. Understand fundamentals deeply before jumping to hard problems. Mock interviews help a lot.',
      upvoteCount: Math.floor(Math.random() * 50),
      upvotedBy: [],
      isVerified: true,
      source: 'nst_internal',
      isSeeded: true,
    });
  }
  console.log(`  Created ${expData.length} interview experiences.`);

  // ── Session Bookings (12) ──
  console.log('\nSeeding session bookings...');
  const bookingStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  let bookingsCreated = 0;

  for (let i = 0; i < 12; i++) {
    const studentSeed = STUDENT_SEEDS[i % STUDENT_SEEDS.length];
    const facultySeed = FACULTY_SEEDS[i % FACULTY_SEEDS.length];
    const studentUser = await User.findOne({ email: studentSeed.email });
    const facultyUser = await User.findOne({ email: facultySeed.email });
    if (!studentUser || !facultyUser) continue;

    const daysFromNow = i < 4 ? -(i * 3) : (i - 3) * 2; // Mix of past and future
    const sessionDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);

    await SessionBooking.create({
      studentId: studentUser._id,
      studentName: studentSeed.name,
      facultyId: facultyUser._id,
      facultyName: facultySeed.name,
      topic: [`How to crack ${['Google', 'Amazon', 'Microsoft', 'Flipkart'][i % 4]} rounds in 4 weeks?`,
              'System Design fundamentals — where to start?',
              'Dynamic Programming patterns and strategies',
              'Resume and profile review'][i % 4],
      notes: 'Looking for structured guidance on this topic.',
      requestedDate: sessionDate,
      requestedTime: ['10:00', '14:00', '16:00', '11:00'][i % 4],
      durationMin: [30, 60][i % 2],
      status: bookingStatuses[i % bookingStatuses.length] as any,
      meetLink: i % 4 !== 3 ? `https://meet.jit.si/NST-PlacePrep-${i.toString().padStart(3, '0')}` : undefined,
      createdAt: daysAgo(Math.max(1, i)),
      isSeeded: true,
    });
    bookingsCreated++;
  }
  console.log(`  Created ${bookingsCreated} session bookings.`);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@newtonschool.co              / Admin@NST2024');
  console.log('  Faculty: priya.nair@newtonschool.co         / Faculty@2024  (10 faculty total)');
  console.log('  Student: arjun.mehta@newtonschool.co        / Student@2024  (10 students total)');
  console.log('  Student: ankita.singh@newtonschool.co       / Student@2024  (PLACED)');
  console.log('  Student: rahul.gupta@newtonschool.co        / Student@2024  (PLACED, top XP)');
  console.log('\nAll seeded data flagged isSeeded: true — run "npm run seed:reset" to wipe only seed data.\n');
  console.log('Summary:');
  console.log(`  Companies: ${COMPANIES.length}`);
  console.log(`  Questions: ${allQuestions.length}`);
  console.log(`  Students: ${STUDENT_SEEDS.length}`);
  console.log(`  Faculty: ${FACULTY_SEEDS.length}`);
  console.log(`  Session Bookings: ${bookingsCreated}`);
  console.log('═══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\nSeed failed:', err.message || err);
  mongoose.disconnect().finally(() => process.exit(1));
});
