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
  const rawUrl = q.practiceUrl || q.leetcodeUrl || q.sourceUrl || q.url || (typeof q.link === "string" ? q.link : null);
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
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


