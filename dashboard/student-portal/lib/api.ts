/**
 * dashboard/student-portal/lib/api.ts
 * Thin fetch client — all student portal API calls live here.
 * Each function returns typed data or throws on failure.
 */

// ─── Generic helper ──────────────────────────────────────────────
async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `API error ${res.status}`);
  }
  return json.data as T;
}

// ─── Types ───────────────────────────────────────────────────────
export interface DashboardData {
  student: {
    fullName: string;
    xpTotal: number;
    currentStreakDays: number;
    longestStreakDays: number;
    leaderboardRank: number;
    onboardingComplete: boolean;
    placementStatus: string;
    targetCompanySlugs: string[];
    branch: string;
    year: string;
  };
  stats: {
    totalSolved: number;
    totalAssigned: number;
    weeklyGoal: number;
    weeklyDone: number;
    pendingDoubts: number;
    upcomingSessions: number;
    xpThisWeek: number;
  };
  roadmaps: Array<{
    companySlug: string;
    companyName: string;
    companyLogoUrl?: string;
    pctComplete: number;
    currentWeek: number;
    weeksCommitted: number;
    roleName: string;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    xp: number;
    createdAt: string;
  }>;
}

export interface RoadmapData {
  _id: string;
  companySlug: string;
  companyName: string;
  companyLogoUrl?: string;
  roleName: string;
  pctComplete: number;
  currentWeek: number;
  weeksCommitted: number;
  isActive: boolean;
  weeks: Array<{
    weekNumber: number;
    topicLabel: string;
    totalQuestions: number;
    doneQuestions: number;
    status: "locked" | "active" | "done";
  }>;
}

export interface QuestionData {
  _id: string;
  problemSummary: string;
  topics: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  roundType: string;
  frequencyScore: number;
  isHot: boolean;
  companySlug: string;
  leetcodeUrl?: string;
}

export interface CompanyData {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  category: string;
  hiringStatus: string;
  avgPackageLpa: number;
  ctcRangeLpa: number[];
  roles: string[];
  totalQuestions: number;
  totalExperiences: number;
  successRate: number;
  topicFrequency: Array<{ topicName: string; questionCount: number; roundType: string }>;
}

export interface DoubtData {
  _id: string;
  subject: string;
  body: string;
  tag: string;
  status: "pending" | "answered" | "closed";
  createdAt: string;
  replies: Array<{
    authorName: string;
    authorRole: string;
    body: string;
    sentAt: string;
  }>;
}

export interface SessionData {
  _id: string;
  facultyId: { fullName: string; subject: string } | string;
  topic: string;
  scheduledAt: string;
  durationMins: number;
  status: "pending" | "confirmed" | "declined" | "completed";
  meetLink?: string;
  notes?: string;
}

export interface NotificationData {
  _id: string;
  type: string;
  title: string;
  subtitle?: string;
  iconName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  branch: string;
  year: string;
  xpTotal: number;
  currentStreakDays: number;
  totalSolved: number;
  isCurrentUser?: boolean;
}

export interface ExperienceData {
  _id: string;
  studentName: string;
  companyName: string;
  companySlug: string;
  role: string;
  outcome: string;
  overallDifficulty: string;
  roundsCount: number;
  offerPackageLpa?: number;
  rounds: Array<{ roundNumber: number; roundType: string; description: string; difficulty: string }>;
  tips: string[];
  upvoteCount: number;
  isVerified: boolean;
  createdAt: string;
}

// ─── Auth ────────────────────────────────────────────────────────
export async function getCurrentUser() {
  return apiFetch<{ userId: string; role: string; name: string; email: string }>("/api/auth/me");
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

// ─── Dashboard ───────────────────────────────────────────────────
export async function getDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>("/api/dashboard");
}

// ─── Profile ─────────────────────────────────────────────────────
export async function getProfile() {
  return apiFetch<Record<string, unknown>>("/api/user/me");
}

export async function updateProfile(body: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/api/user/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// ─── Roadmap ─────────────────────────────────────────────────────
export async function getRoadmaps(): Promise<RoadmapData[]> {
  return apiFetch<RoadmapData[]>("/api/roadmap");
}

// ─── Questions ───────────────────────────────────────────────────
export async function getQuestions(params: {
  companySlug?: string;
  difficulty?: string;
  topic?: string;
  page?: number;
  limit?: number;
}): Promise<{ questions: QuestionData[]; total: number }> {
  const q = new URLSearchParams();
  if (params.companySlug) q.set("companySlug", params.companySlug);
  if (params.difficulty) q.set("difficulty", params.difficulty);
  if (params.topic) q.set("topic", params.topic);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  return apiFetch<{ questions: QuestionData[]; total: number }>(`/api/questions?${q}`);
}

export async function completeQuestion(questionId: string) {
  return apiFetch<{ xpEarned: number; newTotal: number }>(
    `/api/questions/${questionId}/complete`,
    { method: "POST" }
  );
}

// ─── Companies ───────────────────────────────────────────────────
export async function getCompanies(): Promise<CompanyData[]> {
  return apiFetch<CompanyData[]>("/api/companies");
}

export async function getCompany(slug: string): Promise<CompanyData> {
  return apiFetch<CompanyData>(`/api/companies/${slug}`);
}

// ─── Doubts ──────────────────────────────────────────────────────
export async function getDoubts(): Promise<DoubtData[]> {
  return apiFetch<DoubtData[]>("/api/doubts");
}

export async function submitDoubt(body: { subject: string; body: string; tag: string }) {
  return apiFetch<DoubtData>("/api/doubts", { method: "POST", body: JSON.stringify(body) });
}

export async function resolveDoubt(id: string) {
  return apiFetch<{ thread: DoubtData }>(`/api/doubts/${id}/resolve`, { method: "PATCH" });
}

// ─── Sessions ────────────────────────────────────────────────────
export async function getSessions(): Promise<SessionData[]> {
  return apiFetch<SessionData[]>("/api/sessions");
}

export async function bookSession(body: {
  topic: string;
  scheduledAt: string;
  durationMins: number;
  notes?: string;
}) {
  return apiFetch<SessionData>("/api/sessions", { method: "POST", body: JSON.stringify(body) });
}

export async function updateSessionStatus(id: string, action: "accept_proposal" | "cancel") {
  return apiFetch<SessionData>(`/api/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });
}

// ─── Notifications ───────────────────────────────────────────────
export async function getNotifications(): Promise<NotificationData[]> {
  return apiFetch<NotificationData[]>("/api/notifications");
}

export async function markNotificationRead(id: string) {
  return apiFetch<void>(`/api/notifications/${id}/read`, { method: "PATCH" });
}

// ─── Leaderboard ─────────────────────────────────────────────────
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiFetch<LeaderboardEntry[]>("/api/leaderboard");
}

// ─── Experiences ─────────────────────────────────────────────────
export async function getExperiences(params?: {
  companySlug?: string;
  verified?: boolean;
}): Promise<{ experiences: ExperienceData[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.companySlug) q.set("companySlug", params.companySlug);
  if (params?.verified !== undefined) q.set("verified", String(params.verified));
  return apiFetch<{ experiences: ExperienceData[]; total: number }>(`/api/experiences?${q}`);
}

export async function submitExperience(body: Partial<ExperienceData>) {
  return apiFetch<ExperienceData>("/api/experiences", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function upvoteExperience(id: string) {
  return apiFetch<{ upvoteCount: number; isUpvoted: boolean }>(
    `/api/experiences/${id}/upvote`,
    { method: "POST" }
  );
}
