/**
 * dashboard/admin-portal/lib/hooks.ts
 * SWR hooks — wired to real API endpoints.
 */

import useSWR from "swr";
import type { Student, Faculty } from "./types";

// ─── Generic JSON fetcher ────────────────────────────────────────
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
};

// ─── Overview ────────────────────────────────────────────────────
export function useOverviewData() {
  const { data, error, isLoading } = useSWR(
    "/api/admin/overview",
    fetcher,
    {
      refreshInterval: 30_000,
      onError: () => {}, // suppress console noise; fallback handled below
    }
  );

  return {
    data: data ?? (error ? undefined : undefined),
    isLoading: isLoading && !error,
    isError: !!error,
  };
}

// ─── Students ────────────────────────────────────────────────────
export function useStudents(page = 1, limit = 10, search = "", batch = "") {
  const batchParam = batch && batch !== "All" ? `&batch=${encodeURIComponent(batch)}` : "";
  const key = `/api/admin/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}${batchParam}`;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  let students: Student[] = [];
  let total = 0;

  if (data) {
    students = data.students ?? data.data ?? [];
    total = data.total ?? 0;
  }

  return { students, total, isLoading, isError: !!error, mutate };
}

// ─── Student Platform-wide Stats (for KPI strip) ─────────────────
// Fetches aggregated stats for ALL students, not just the current page.
// Used by the Students page KPI strip to show accurate placed/avg counts.
export function useStudentStats() {
  const { data, error, isLoading } = useSWR('/api/admin/students/stats', fetcher);
  return { data, isLoading, isError: !!error };
}


// ─── Student Detail ──────────────────────────────────────────────
export function useStudent(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/admin/students/${id}` : null,
    fetcher
  );
  return { student: data, isLoading, isError: !!error, mutate };
}

// ─── Faculty ─────────────────────────────────────────────────────
export function useFaculty(page = 1, limit = 10, search = "") {
  const key = `/api/admin/faculty?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
  const { data, error, isLoading, mutate } = useSWR(key, fetcher);

  let faculty: Faculty[] = [];
  let total = 0;

  if (data) {
    faculty = data.faculty ?? data.data ?? [];
    total = data.total ?? 0;
  }

  return { faculty, total, isLoading, isError: !!error, mutate };
}

// ─── Analytics ───────────────────────────────────────────────────
export function useEngagementData(_range = "30d") {
  const { data, error, isLoading } = useSWR(
    `/api/admin/analytics/engagement?range=${_range}`,
    fetcher,
    { refreshInterval: 30_000 }
  );
  return { data: data ?? undefined, isLoading: isLoading && !error, isError: !!error };
}

export function useDoubtsData(_range = "monthly") {
  const { data, error, isLoading } = useSWR(
    `/api/admin/analytics/doubts?range=${_range}`,
    fetcher
  );
  return { data: data ?? undefined, isLoading: isLoading && !error, isError: !!error };
}

export function usePracticeData(_range = "30d") {
  const { data, error, isLoading } = useSWR(
    `/api/admin/analytics/practice?range=${_range}`,
    fetcher
  );
  return { data: data ?? undefined, isLoading: isLoading && !error, isError: !!error };
}

export function usePlacementData() {
  const { data, error, isLoading } = useSWR(
    "/api/admin/analytics/placement",
    fetcher
  );
  return { data: data ?? undefined, isLoading: isLoading && !error, isError: !!error };
}

// ─── Leaderboard ─────────────────────────────────────────────────
export function useLeaderboard(_batch = "all", _period = "monthly") {
  const { data, error, isLoading } = useSWR(
    `/api/admin/leaderboard?batch=${_batch}&period=${_period}`,
    fetcher
  );
  const entries = data?.entries ?? data ?? [];
  return { leaderboard: Array.isArray(entries) ? entries : [], isLoading: isLoading && !error, isError: !!error };
}

// ─── Bookings ────────────────────────────────────────────────────
export function useBookingsData(_range = "30d") {
  const { data, error, isLoading } = useSWR(
    `/api/admin/bookings/stats?range=${_range}`,
    fetcher
  );
  return { data: data ?? undefined, isLoading: isLoading && !error, isError: !!error };
}

// ─── Mutations ───────────────────────────────────────────────────

/** Update a student's profile (PATCH /api/admin/students/:id) */
export async function patchStudent(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/students/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Create a new faculty account (POST /api/admin/faculty) */
export async function createFaculty(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/faculty", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Deactivate a faculty member (DELETE /api/admin/faculty/:id) */
export async function deactivateFaculty(id: string) {
  const res = await fetch(`/api/admin/faculty/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Broadcast notification to users (POST /api/admin/notifications/send) */
export async function broadcastNotification(body: {
  targetRole: string;
  title: string;
  subtitle: string;
  type: string;
}) {
  const res = await fetch("/api/admin/notifications/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Reset a user's password (POST /api/admin/users/:id/reset-password) */
export async function resetUserPassword(userId: string) {
  const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Create a new user account (POST /api/admin/users/create) */
export async function createUser(body: {
  email: string;
  role: string;
  fullName: string;
}) {
  const res = await fetch("/api/admin/users/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Admin Questions ──────────────────────────────────────────────────────────

export function useAdminQuestions(
  page: number,
  limit: number,
  filters: {
    company?: string;
    difficulty?: string;
    roundType?: string;
    questionType?: string;
    verified?: string;
  }
) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (filters.company) qs.set("company", filters.company);
  if (filters.difficulty) qs.set("difficulty", filters.difficulty);
  if (filters.roundType) qs.set("roundType", filters.roundType);
  if (filters.questionType) qs.set("questionType", filters.questionType);
  if (filters.verified) qs.set("verified", filters.verified);
  return useSWR(`/api/admin/questions?${qs.toString()}`, fetcher);
}

export async function patchQuestion(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/questions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteQuestion(id: string) {
  const res = await fetch(`/api/admin/questions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function bulkApproveQuestions(ids: string[], verified: boolean) {
  const res = await fetch("/api/admin/questions/bulk-approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ids, verified }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useAdminQuestion(id: string | null) {
  return useSWR(id ? `/api/admin/questions/${id}` : null, fetcher);
}

export async function bulkApproveByFilter(
  filters: { company?: string; difficulty?: string; questionType?: string; verified?: string },
  verified: boolean
) {
  const res = await fetch("/api/admin/questions/bulk-approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ filter: filters, verified }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Admin Companies ──────────────────────────────────────────────────────────

export function useAdminCompanies(page: number, limit: number, category?: string) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (category) qs.set("category", category);
  return useSWR(`/api/admin/companies?${qs.toString()}`, fetcher);
}

export async function patchAdminCompany(slug: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/companies/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
