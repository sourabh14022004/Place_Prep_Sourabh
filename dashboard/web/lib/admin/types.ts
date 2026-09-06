// ─── Existing Types ───────────────────────────────────────────────

export interface Student {
  id: number;
  name: string;
  fullName?: string;   // backend returns fullName; name is kept as fallback
  batch: string;
  progress: number;
  doubts: number;
  sessions: number;
  status: "PLACED" | "IN PROGRESS" | "INACTIVE";
  email?: string;
  phone?: string;
}

export interface Faculty {
  id: number;
  name: string;
  initials: string;
  subject: string;
  accepted: number;
  declined: number;
  satisfaction: number;
  responseRate: number;
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "INVITE PENDING";
  email: string;
  stream?: string;
  avatar?: string;
}

export interface Session {
  id: number;
  mentorName: string;
  mentorInitials: string;
  topic: string;
  dateTime: string;
  status: "upcoming" | "completed" | "cancelled";
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "info" | "alert" | "success";
}

export interface OverviewStats {
  studentsOnRoadmap: number;
  studentsOnRoadmapChange: number;
  doubtsRaised: number;
  sessionsBooked: number;
  sessionsCompleted: number;
  avgSatisfaction: number;
  placementRate: number;
  activeUsers: number;
  serverLoad: number;
  // Phase 2 additions
  totalStudents: number;
  placedStudents: number;
  inProgressStudents: number;
  totalFaculty: number;
  activeFaculty: number;
  inactiveFaculty: number;
  activeStudents: number;
  inactiveStudents: number;
  dauStudents: number;
  dauFaculty: number;
  mauStudents: number;
  mauFaculty: number;
  currentOnlineStudents: number;
  currentOnlineFaculty: number;
  requestsPerMinute?: number;  // real-time sliding window counter
}

export interface WeeklySession {
  week: string;
  count: number;
}

// ─── Phase 2: Engagement Analytics ──────────────────────────────

export interface DailyActiveEntry {
  date: string;
  students: number;
  faculty: number;
}

export interface HeatmapEntry {
  day: number; // 0=Mon, 6=Sun
  hour: number; // 0–23
  count: number;
}

export interface EngagementData {
  dailyActive: DailyActiveEntry[];
  currentOnline: { students: number; faculty: number };
  monthlyActive: Array<{ month: string; students: number; faculty: number }>;
  hourlyHeatmap: HeatmapEntry[];
}

// ─── Phase 2: Doubts Intelligence ────────────────────────────────

export interface DoubtsTimeline {
  period: string;
  raised: number;
  resolved: number;
}

export interface BatchDoubtStat {
  batch: string;
  raised: number;
  resolved: number;
}

export interface FacultyDoubtStat {
  facultyId: number;
  name: string;
  resolved: number;
  rate: number;
}

export interface SubjectDoubtStat {
  subject: string;
  count: number;
}

export interface DoubtsData {
  summary: {
    totalRaised: number;
    totalResolved: number;
    resolutionRate: number;
    avgResolutionHours: number;
  };
  timeline: DoubtsTimeline[];
  byBatch: BatchDoubtStat[];
  byFaculty: FacultyDoubtStat[];
  bySubject: SubjectDoubtStat[];
  hourlyPattern: HeatmapEntry[];
}

// ─── Phase 2: Practice Zone ──────────────────────────────────────

export interface DomainStat {
  domain: string;
  questionsSolved: number;
  uniqueStudents: number;
}

export interface BatchDomainRow {
  batch: string;
  domains: Record<string, number>;
}

export interface PracticeData {
  summary: {
    totalSolved: number;
    activeSolversToday: number;
    topDomain: string;
  };
  byDomain: DomainStat[];
  batchDomainMatrix: BatchDomainRow[];
  dailySolvers: Array<{ date: string; uniqueSolvers: number }>;
}

// ─── Phase 2: Placement Tracker ──────────────────────────────────

export interface CompanyInterest {
  company: string;
  studentCount: number;
}

export interface BatchPlacementRate {
  batch: string;
  rate: number;
  placed: number;
  total: number;
}

export interface AssignmentSolveRate {
  period: string;
  rate: number;
  completed: number;
  assigned: number;
}

export interface PlacementData {
  companyInterest: CompanyInterest[];
  batchPlacementRate: BatchPlacementRate[];
  assignmentSolveRate: AssignmentSolveRate[];
}

// ─── Phase 2: Leaderboard ────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  studentId: number;
  name: string;
  batch: string;
  xp: number;
  tasksCompleted: number;
  doubtsRaised: number;
  initials: string;
}

// ─── Phase 2: Slot Bookings ──────────────────────────────────────

export interface BatchBookingStat {
  batch: string;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export interface BookingsData {
  summary: { today: number; thisWeek: number; thisMonth: number };
  byBatch: BatchBookingStat[];
  dailyTrend: Array<{ date: string; count: number }>;
  topFaculty: Array<{ facultyId: number; name: string; bookings: number }>;
}

// ─── Phase 2: Push Notification (sent log) ───────────────────────

export interface SentNotification {
  id: number;
  title: string;
  message: string;
  target: "students" | "faculty" | "all";
  sentAt: string;
  status: "sent" | "scheduled" | "failed";
}
