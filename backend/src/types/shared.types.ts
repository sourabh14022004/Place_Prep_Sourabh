/**
 * backend/src/types/shared.types.ts
 * Canonical TypeScript interfaces — single source of truth.
 * Imported by all three Next.js portals and the backend service layer.
 */

// ─── Auth & Identity ──────────────────────────────────────────────────────────

export type UserRole = 'student' | 'faculty' | 'admin';

export type PlacementStatus = 'PLACED' | 'IN_PROGRESS' | 'INACTIVE';

export type FacultyStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'INVITE_PENDING';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: string;
  role: UserRole;
  email: string;
}

// ─── Student Profile ──────────────────────────────────────────────────────────

export interface StudentProfile {
  _id: string;
  userId: string;
  fullName: string;
  batch: string;
  branch: string;
  year: '1st' | '2nd' | '3rd' | '4th';
  avatarUrl?: string;
  onboardingComplete: boolean;
  placementStatus: PlacementStatus;
  placedCompany?: string;
  placedRole?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  xpTotal: number;
  currentStreakDays: number;
  lastActiveAt?: Date;
  // Onboarding data
  targetDomains: string[];
  targetCategories: CompanyCategory[];
  topicSelfRatings: Record<string, number>;
  targetCompanySlugs: string[];
  prepWeeksCommitted: number;
  onboardingCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Faculty Profile ──────────────────────────────────────────────────────────

export interface FacultyProfile {
  _id: string;
  userId: string;
  fullName: string;
  initials: string;
  subject: string;
  stream?: string;
  avatarUrl?: string;
  status: FacultyStatus;
  acceptCount: number;
  declineCount: number;
  satisfactionAvg: number;
  responseRate: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Company & Intelligence ───────────────────────────────────────────────────

export type CompanyCategory = 'maang' | 'product' | 'service' | 'startup' | 'bfsi' | 'other';

export type HiringStatus = 'Active Hiring' | 'Slow Hiring' | 'Paused';

export type RoundType = 'Coding' | 'System Design' | 'HR' | 'Aptitude' | 'LLD' | 'Domain' | 'Managerial';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface RoundStructure {
  roundNumber: number;
  roundName: string;
  roundType: RoundType;
  typicalDurationMin?: number;
  description?: string;
}

export interface TopicFrequency {
  topicSlug: string;
  topicName: string;
  frequencyPct: number;
  questionCount: number;
}

export interface DifficultyDistribution {
  Easy: number;
  Medium: number;
  Hard: number;
}

export interface Company {
  _id: string;
  slug: string;
  name: string;
  category: CompanyCategory;
  tier?: string;
  country: string;
  logoUrl?: string;
  hiringStatus: HiringStatus;
  avgSalaryLpa?: string;
  avgProcessWeeks?: string;
  hiringNote?: string;
  successRate?: string;
  roundStructure: RoundStructure[];
  topicFrequency: TopicFrequency[];
  difficultyDistribution: DifficultyDistribution;
  lastSyncedAt?: Date;
  createdAt: Date;
}

// ─── Questions ────────────────────────────────────────────────────────────────

export interface Question {
  _id: string;
  companyId: string;
  companySlug: string;
  companyName?: string;
  roundType: RoundType;
  roundNumber?: number;
  problemSummary: string;
  difficulty: Difficulty;
  topics: string[];
  source: string;
  sourceUrl?: string;
  leetcodeUrl?: string;
  frequencyScore: number;
  xpValue: number;
  isHot: boolean;
  verified: boolean;
  createdAt: Date;
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────

export type WeekStatus = 'done' | 'active' | 'locked';

export interface RoadmapWeek {
  weekNumber: number;
  topicLabel: string;
  totalQuestions: number;
  doneQuestions: number;
  status: WeekStatus;
}

export interface UserRoadmap {
  _id: string;
  studentId: string;
  companyId: string;
  companySlug: string;
  companyName?: string;
  companyLogoUrl?: string;
  roleName: string;
  weeksCommitted: number;
  currentWeek: number;
  pctComplete: number;
  isActive: boolean;
  weeks: RoadmapWeek[];
  addedAt: Date;
}

// ─── Doubts ───────────────────────────────────────────────────────────────────

export type DoubtTag = 'DSA' | 'System Design' | 'LLD' | 'HR' | 'General' | 'Web Development' | 'Aptitude';

/**
 * Canonical doubt-domain list — the single source of truth for faculty routing.
 *
 * A faculty member's `doubtDomains` holds values from this list, and a doubt's
 * `tag` is matched against it directly. Previously routing relied on a
 * TAG_TO_SUBJECT map that translated short tags ("DSA") into long-form subject
 * strings ("Data Structures & Algorithms"), which meant three separate
 * vocabularies had to agree; they didn't, so routing silently matched nothing.
 * Tags and domains are now the same strings, so no translation exists to drift.
 *
 * Order is the display order in the admin assignment UI.
 */
export const DOUBT_DOMAINS: readonly DoubtTag[] = [
  'DSA',
  'System Design',
  'LLD',
  'Web Development',
  'Aptitude',
  'HR',
  'General',
] as const;

/** Runtime guard for untrusted input (admin PATCH bodies, query params). */
export function isDoubtDomain(value: unknown): value is DoubtTag {
  return typeof value === 'string' && (DOUBT_DOMAINS as readonly string[]).includes(value);
}

export type DoubtStatus = 'pending' | 'answered' | 'resolved';

export interface DoubtReply {
  _id: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'faculty';
  body: string;
  sentAt: Date;
}

export interface DoubtThread {
  _id: string;
  studentId: string;
  studentName?: string;
  assignedFacultyId?: string;
  assignedFacultyName?: string;
  subject: string;
  body: string;
  tag: DoubtTag;
  status: DoubtStatus;
  replies: DoubtReply[];
  createdAt: Date;
  resolvedAt?: Date;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type SessionStatus = 'pending' | 'confirmed' | 'proposed' | 'completed' | 'cancelled';

export interface SessionBooking {
  _id: string;
  studentId: string;
  studentName?: string;
  facultyId: string;
  facultyName?: string;
  topic: string;
  notes?: string;
  requestedDate: string;
  requestedTime: string;
  durationMin: 30 | 60;
  status: SessionStatus;
  meetLink?: string;
  proposedDate?: string;
  proposedTime?: string;
  studentFeedbackRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Interview Experiences ────────────────────────────────────────────────────

export type ExperienceOutcome = 'offer' | 'rejected' | 'waiting';

export interface ExperienceRound {
  roundNumber: number;
  type: string;
  topics: string[];
  description: string;
  cleared: boolean;
}

export interface InterviewExperience {
  _id: string;
  studentId: string;
  studentName?: string;
  companyId: string;
  companySlug: string;
  companyName?: string;
  role: string;
  interviewDate: Date;
  outcome: ExperienceOutcome;
  overallDifficulty: Difficulty;
  roundsCount: number;
  rounds: ExperienceRound[];
  experienceText: string;
  tips?: string;
  upvoteCount: number;
  isUpvotedByMe?: boolean;
  isVerified: boolean;
  source: string;
  createdAt: Date;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'badge'
  | 'new_company'
  | 'roadmap'
  | 'experience'
  | 'question'
  | 'xp'
  | 'session'
  | 'doubt'
  | 'system';

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  subtitle?: string;
  iconName?: string;
  isRead: boolean;
  createdAt: Date;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  batch: string;
  branch: string;
  avatarUrl?: string;
  xp: number;
  tasksCompleted: number;
  doubtsRaised: number;
  placementStatus: PlacementStatus;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  xpTotal: number;
  currentStreakDays: number;
  problemsSolved: number;
  prepScore: number;
  companiesOnRoadmap: number;
  sessionsBooked: number;
  doubtsRaised: number;
  weeklyActivity: { date: string; count: number }[];
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────

export interface EngagementAnalytics {
  dau: { date: string; students: number; faculty: number }[];
  heatmap: { dayOfWeek: number; hourOfDay: number; count: number }[];
  totalStudents: number;
  activeToday: number;
  avgDailyActive: number;
}

export interface DoubtAnalytics {
  totalDoubts: number;
  resolutionRate: number;
  avgResolutionHours: number;
  byTag: { tag: string; count: number; resolved: number }[];
  byFaculty: { facultyName: string; assigned: number; resolved: number; avgHours: number }[];
  timeline: { date: string; raised: number; resolved: number }[];
}

export interface PlacementAnalytics {
  placedCount: number;
  inProgressCount: number;
  inactiveCount: number;
  byBatch: { batch: string; placed: number; total: number }[];
  byCompanyCategory: { category: CompanyCategory; count: number }[];
  recentPlacements: { studentName: string; company: string; role: string; date: Date }[];
}
