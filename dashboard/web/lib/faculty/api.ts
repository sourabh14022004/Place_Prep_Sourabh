/**
 * dashboard/faculty-portal/lib/api.ts
 * Thin fetch client — all faculty portal API calls live here.
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
export interface FacultyDashboardData {
  faculty: {
    fullName: string;
    initials: string;
    subject: string;
    stream: string;
    status: string;
    acceptCount: number;
    declineCount: number;
  };
  stats: {
    pendingSessions: number;
    confirmedSessions: number;
    totalDoubts: number;
    unansweredDoubts: number;
    studentsAssigned: number;
    avgResponseTimeHours: number;
  };
  upcomingSessions: SessionData[];
  pendingDoubts: DoubtData[];
}

export interface SessionData {
  _id: string;
  studentId: { fullName: string; batch: string; branch: string } | string;
  topic: string;
  scheduledAt: string;
  durationMins: number;
  status: "pending" | "confirmed" | "declined" | "completed";
  proposedAlternativeAt?: string;
  meetLink?: string;
  notes?: string;
}

export interface DoubtData {
  _id: string;
  studentId: { fullName: string; batch: string } | string;
  studentName: string;
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

export interface StudentMatrixEntry {
  studentId: string;
  fullName: string;
  branch: string;
  year: string;
  xpTotal: number;
  currentStreakDays: number;
  totalSolved: number;
  placementStatus: string;
  targetCompanySlugs: string[];
  lastActiveAt?: string;
  rankChange?: number | string;
  subjectBreakdown?: { dsa: number; sysdesign: number; webdev: number; dbms: number; cloud: number };
  recentMocks?: any[];
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

export interface FacultyProfile {
  userId: string;
  fullName: string;
  initials: string;
  subject: string;
  stream: string;
  bio?: string;
  status: string;
  acceptCount: number;
  declineCount: number;
}

// ─── Auth ────────────────────────────────────────────────────────
export async function getCurrentUser() {
  return apiFetch<{ userId: string; role: string; name: string; email: string }>("/api/auth/me");
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

// ─── Dashboard ───────────────────────────────────────────────────
export async function getDashboard(): Promise<FacultyDashboardData> {
  return apiFetch<FacultyDashboardData>("/api/faculty/dashboard");
}

// ─── Profile ─────────────────────────────────────────────────────
export async function getProfile(): Promise<FacultyProfile> {
  return apiFetch<FacultyProfile>("/api/faculty/profile");
}

export async function updateProfile(body: Partial<FacultyProfile>) {
  return apiFetch<FacultyProfile>("/api/faculty/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// ─── Sessions ────────────────────────────────────────────────────
export async function getSessions(status?: string): Promise<{ sessions: SessionData[]; total: number }> {
  const q = status ? `?status=${status}` : "";
  return apiFetch<{ sessions: SessionData[]; total: number }>(`/api/faculty/sessions${q}`);
}

export async function confirmSession(id: string, meetLink?: string) {
  return apiFetch<SessionData>(`/api/faculty/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "confirm", meetLink }),
  });
}

export async function declineSession(id: string, reason?: string) {
  return apiFetch<SessionData>(`/api/faculty/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "decline", reason }),
  });
}

export async function proposeAlternative(id: string, proposedDate: string, proposedTime: string) {
  return apiFetch<SessionData>(`/api/faculty/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "propose", proposedDate, proposedTime }),
  });
}

// ─── Doubts ──────────────────────────────────────────────────────
/**
 * GET /api/faculty/doubts
 *
 * The route replies with successResponse(threads) where threads is a bare
 * array, and apiFetch already unwraps `json.data`. This used to be typed as
 * `{ doubts, total }`, so callers destructured `{ doubts }` off an array and
 * got undefined — the doubt list silently rendered empty. Return the array.
 */
export async function getDoubts(status?: string): Promise<DoubtData[]> {
  const q = status ? `?status=${status}` : "";
  const data = await apiFetch<DoubtData[]>(`/api/faculty/doubts${q}`);
  return Array.isArray(data) ? data : [];
}

export async function replyToDoubt(doubtId: string, body: string) {
  return apiFetch<DoubtData>(`/api/faculty/doubts/${doubtId}/replies`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function resolveDoubt(doubtId: string) {
  return apiFetch<DoubtData>(`/api/faculty/doubts/${doubtId}/resolve`, {
    method: "PATCH"
  });
}

// ─── Students ────────────────────────────────────────────────────
export async function getStudents(): Promise<{ students: StudentMatrixEntry[]; total: number }> {
  return apiFetch<{ students: StudentMatrixEntry[]; total: number }>("/api/faculty/students");
}

// ─── Notifications ───────────────────────────────────────────────
export async function getNotifications(): Promise<NotificationData[]> {
  const res = await apiFetch<{ notifications: NotificationData[]; unreadCount: number }>("/api/faculty/notifications");
  return res.notifications;
}

export async function markNotificationRead(id: string) {
  return apiFetch<void>(`/api/faculty/notifications/${id}`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return apiFetch<void>("/api/faculty/notifications/read-all", { method: "POST" });
}
