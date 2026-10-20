import { Monitor, Building, Calculator, Users, Zap, GraduationCap, Target, FileText, HelpCircle } from "lucide-react";

export type RoundType = "Coding" | "System Design" | "LLD" | "HR" | "Aptitude" | "Domain";

export interface PracticeCategory {
  id: string;
  label: string;
  iconName: string;
  description: string;
  totalQuestions: number;
  color: string;
  textColor: string;
  borderColor: string;
  roundTypes: RoundType[];
}

export const allTopics = [
  "Arrays", "DP", "Graphs", "Trees", "Binary Search",
  "Heaps", "Stacks", "Linked List", "Sliding Window",
  "Backtracking", "System Design", "LLD", "DBMS",
  "OS", "Networking", "OOP", "Aptitude", "Behavioral",
];

export const practiceCategories: PracticeCategory[] = [
  {
    id: "dsa",
    label: "DSA",
    iconName: "Monitor",
    description: "Data Structures & Algorithms — arrays, graphs, DP, trees",
    totalQuestions: 0,
    color: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    roundTypes: ["Coding"],
  },
  {
    id: "system-design",
    label: "System Design",
    iconName: "Building",
    description: "High-level design — scalability, databases, caching, APIs",
    totalQuestions: 0,
    color: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    roundTypes: ["System Design"],
  },
  {
    id: "aptitude",
    label: "Aptitude",
    iconName: "Calculator",
    description: "Quant, logical reasoning, verbal for TCS NQT, Infosys Spectra",
    totalQuestions: 0,
    color: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    roundTypes: ["Aptitude"],
  },
  {
    id: "behavioral",
    label: "HR & Behavioral",
    iconName: "Users",
    description: "Amazon Leadership Principles, STAR method, cultural fit",
    totalQuestions: 0,
    color: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    roundTypes: ["HR"],
  },
];

export type Difficulty = "Easy" | "Medium" | "Hard";

export type CompanyCategory = "maang" | "product" | "service" | "startup" | "bfsi" | "other";

export interface TopicRating {
  id: string;
  label: string;
  defaultRating: number;
}


export interface RoadmapWeek {
  weekNum: number;
  topic: string;
  totalQuestions: number;
  doneQuestions: number;
  status: "done" | "active" | "locked";
  questions: {
    id: number | string;
    title: string;
    diff: Difficulty;
    xp: number;
    leetcodeUrl?: string;
    practiceUrl?: string;
    sourceUrl?: string;
    url?: string;
    done?: boolean;
  }[];
  /** IDs of questions assigned to this week — deduped across weeks at read time */
  questionIds?: string[];
}

export interface UserRoadmapCompany {
  slug: string;
  name: string;
  initial: string;
  color: string;
  role: string;
  totalWeeks: number;
  currentWeek: number;
  pctComplete: number;
  roadmapId?: string;  // MongoDB _id of the Roadmap document — needed for weekly progress tracking
  weeks: RoadmapWeek[];
}

/**
 * Resolves the direct solve/problem URL from any question object shape.
 * Questions in MongoDB can store the problem link in `sourceUrl`, `leetcodeUrl`, `practiceUrl`, or `url`.
 */
export function getPracticeUrl(q: any): string | null {
  if (!q) return null;
  // If it's an interactive MCQ with options, practice happens directly inside PlacePrep portal
  if (q.isMcq && Array.isArray(q.options) && q.options.length > 0) return null;
  const rawUrl = q.practiceUrl || q.leetcodeUrl || q.sourceUrl || q.url || (typeof q.link === "string" ? q.link : null);
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  // Don't treat raw GitHub markdown repositories as external interactive practice platforms
  if (trimmed.includes("github.com/")) return null;
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Returns user-friendly platform metadata (label, name) for external problem links.
 */
export function getPlatformInfo(url: string | null | undefined): { name: string; host: string } {
  if (!url) return { name: "Platform", host: "" };
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("leetcode")) return { name: "LeetCode", host };
    if (host.includes("geeksforgeeks")) return { name: "GeeksforGeeks", host };
    if (host.includes("hackerrank")) return { name: "HackerRank", host };
    if (host.includes("codeforces")) return { name: "Codeforces", host };
    if (host.includes("codechef")) return { name: "CodeChef", host };
    if (host.includes("interviewbit")) return { name: "InterviewBit", host };
    return { name: "Practice Platform", host };
  } catch {
    return { name: "Practice Platform", host: "" };
  }
}

export const TARGET_ROLES = [
  'SDE-1', 'SDE-2', 'SDE-3',
  'Data Analyst', 'Product Manager',
  'DevOps', 'ML Engineer', 'QA',
] as const;

export type TargetRole = typeof TARGET_ROLES[number];

export interface RoleTopicItem {
  topicSlug: string;
  topicName: string;
  frequencyPct: number;
  questionCount: number;
  roundType?: string;
}

export const ROLE_FOCUS_DESCRIPTIONS: Record<string, string> = {
  'SDE-1': 'Core DSA, Problem Solving, OOP & DBMS Foundations',
  'SDE-2': 'System Design (HLD/LLD), Advanced DSA, Concurrency & Scalability',
  'SDE-3': 'Distributed Architecture, High Scale, Microservices & Leadership',
  'Data Analyst': 'Advanced SQL, Python / Pandas, Business Metrics & Statistics',
  'Product Manager': 'Product Sense, Strategy, Metrics, System Fluency & Leadership',
  'DevOps': 'CI/CD Pipelines, Kubernetes, Docker, Cloud & Observability',
  'ML Engineer': 'ML Algorithms, Deep Learning, MLOps, Pipelines & Math',
  'QA': 'Test Automation, API Testing, Performance & QA Strategy',
};

export const ROLE_DEFAULT_TOPICS: Record<string, RoleTopicItem[]> = {
  'SDE-1': [
    { topicSlug: 'arrays-strings', topicName: 'Arrays & Strings', frequencyPct: 25, questionCount: 15, roundType: 'Coding' },
    { topicSlug: 'dynamic-programming', topicName: 'Dynamic Programming', frequencyPct: 20, questionCount: 12, roundType: 'Coding' },
    { topicSlug: 'trees-graphs', topicName: 'Trees & Graphs', frequencyPct: 20, questionCount: 12, roundType: 'Coding' },
    { topicSlug: 'oops-clean-code', topicName: 'OOP & Clean Code', frequencyPct: 15, questionCount: 8, roundType: 'LLD' },
    { topicSlug: 'dbms-sql', topicName: 'DBMS & SQL', frequencyPct: 10, questionCount: 6, roundType: 'Domain' },
    { topicSlug: 'os-networking', topicName: 'OS & Computer Networks', frequencyPct: 10, questionCount: 6, roundType: 'Domain' },
  ],
  'SDE-2': [
    { topicSlug: 'system-design-hld', topicName: 'System Design (HLD)', frequencyPct: 25, questionCount: 15, roundType: 'System Design' },
    { topicSlug: 'low-level-design', topicName: 'Low-Level Design (LLD & Patterns)', frequencyPct: 20, questionCount: 12, roundType: 'LLD' },
    { topicSlug: 'advanced-dsa', topicName: 'Advanced DSA & Optimization', frequencyPct: 20, questionCount: 12, roundType: 'Coding' },
    { topicSlug: 'concurrency-multithreading', topicName: 'Concurrency & Multithreading', frequencyPct: 15, questionCount: 8, roundType: 'Coding' },
    { topicSlug: 'caching-databases', topicName: 'Caching & Scalable Databases', frequencyPct: 10, questionCount: 6, roundType: 'Domain' },
    { topicSlug: 'distributed-architecture', topicName: 'Distributed Architecture', frequencyPct: 10, questionCount: 6, roundType: 'System Design' },
  ],
  'SDE-3': [
    { topicSlug: 'distributed-systems', topicName: 'Distributed Systems & Scalability', frequencyPct: 25, questionCount: 15, roundType: 'System Design' },
    { topicSlug: 'microservices-messaging', topicName: 'Microservices & Event Streaming', frequencyPct: 20, questionCount: 12, roundType: 'System Design' },
    { topicSlug: 'system-reliability', topicName: 'High Availability & Fault Tolerance', frequencyPct: 20, questionCount: 12, roundType: 'System Design' },
    { topicSlug: 'cloud-security', topicName: 'Cloud Security & Governance', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'engineering-leadership', topicName: 'Engineering Leadership & Tradeoffs', frequencyPct: 10, questionCount: 6, roundType: 'HR' },
    { topicSlug: 'advanced-hld', topicName: 'Complex Large-Scale Architecture', frequencyPct: 10, questionCount: 6, roundType: 'System Design' },
  ],
  'Data Analyst': [
    { topicSlug: 'sql-queries', topicName: 'Advanced SQL & Query Optimization', frequencyPct: 30, questionCount: 18, roundType: 'Domain' },
    { topicSlug: 'python-pandas', topicName: 'Python & Data Wrangling (Pandas)', frequencyPct: 25, questionCount: 14, roundType: 'Domain' },
    { topicSlug: 'statistics-probability', topicName: 'Statistics & Probability', frequencyPct: 20, questionCount: 10, roundType: 'Aptitude' },
    { topicSlug: 'bi-visualization', topicName: 'Data Visualization & Dashboards', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'metrics-kpis', topicName: 'Business Metrics & KPI Analysis', frequencyPct: 10, questionCount: 6, roundType: 'Domain' },
  ],
  'Product Manager': [
    { topicSlug: 'product-design-sense', topicName: 'Product Sense & Feature Design', frequencyPct: 30, questionCount: 18, roundType: 'Domain' },
    { topicSlug: 'metrics-ab-testing', topicName: 'Metrics, KPIs & A/B Testing', frequencyPct: 25, questionCount: 14, roundType: 'Domain' },
    { topicSlug: 'product-strategy-gtm', topicName: 'Product Strategy & GTM Planning', frequencyPct: 20, questionCount: 10, roundType: 'Domain' },
    { topicSlug: 'tech-fluency-architecture', topicName: 'Tech Fluency & System Architecture', frequencyPct: 15, questionCount: 8, roundType: 'System Design' },
    { topicSlug: 'behavioral-leadership', topicName: 'Stakeholder Alignment & Leadership', frequencyPct: 10, questionCount: 6, roundType: 'HR' },
  ],
  'DevOps': [
    { topicSlug: 'cicd-automation', topicName: 'CI/CD Pipelines & Automation', frequencyPct: 25, questionCount: 15, roundType: 'Domain' },
    { topicSlug: 'docker-kubernetes', topicName: 'Containers & Kubernetes (K8s)', frequencyPct: 25, questionCount: 14, roundType: 'Domain' },
    { topicSlug: 'cloud-iac', topicName: 'Cloud Platforms & IaC (AWS/Terraform)', frequencyPct: 20, questionCount: 10, roundType: 'Domain' },
    { topicSlug: 'linux-scripting', topicName: 'Linux Administration & Shell Scripting', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'monitoring-observability', topicName: 'Observability & Monitoring', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
  ],
  'ML Engineer': [
    { topicSlug: 'ml-algorithms', topicName: 'Machine Learning Algorithms & Modeling', frequencyPct: 25, questionCount: 15, roundType: 'Domain' },
    { topicSlug: 'deep-learning', topicName: 'Deep Learning (PyTorch / TensorFlow)', frequencyPct: 25, questionCount: 14, roundType: 'Domain' },
    { topicSlug: 'mlops-deployment', topicName: 'MLOps, Model Serving & Deployment', frequencyPct: 20, questionCount: 10, roundType: 'Domain' },
    { topicSlug: 'math-statistics', topicName: 'Math, Linear Algebra & Probability', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'data-pipelines-nlp-cv', topicName: 'Data Pipelines & Feature Engineering', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
  ],
  'QA': [
    { topicSlug: 'test-automation', topicName: 'Automation Testing (Selenium/Cypress)', frequencyPct: 30, questionCount: 18, roundType: 'Domain' },
    { topicSlug: 'api-testing', topicName: 'API Testing (Postman / REST Assured)', frequencyPct: 25, questionCount: 14, roundType: 'Domain' },
    { topicSlug: 'manual-testing', topicName: 'Test Scenarios & Edge Cases', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'performance-testing', topicName: 'Performance & Load Testing (JMeter/k6)', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
    { topicSlug: 'cicd-qa-integration', topicName: 'CI/CD Test Pipelines & Bug Tracking', frequencyPct: 15, questionCount: 8, roundType: 'Domain' },
  ],
};
