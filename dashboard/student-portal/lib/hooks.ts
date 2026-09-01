/**
 * dashboard/student-portal/lib/hooks.ts
 * SWR-based data hooks for the student portal.
 * All hooks auto-revalidate on focus, deduplicate concurrent requests,
 * and return consistent { data, error, isLoading } shapes.
 *
 * Usage:
 *   const { data, isLoading, error } = useDashboard();
 */

import useSWR, { mutate as globalMutate } from 'swr';

// ── Fetch timeout ──────────────────────────────────────────────────────────
// Without this, a request that never settles leaves SWR's isLoading stuck at
// true forever — the page renders its spinner branch permanently with no error
// to fall back to. Every read goes through fetchWithTimeout so a hung request
// eventually rejects and pages can show an error state instead of hanging.
export const REQUEST_TIMEOUT_MS = 15_000;

export class TimeoutError extends Error {
  constructor(message = 'Request timed out. Please check your connection and try again.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

async function fetchWithTimeout(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { credentials: 'include', signal: controller.signal });
  } catch (e) {
    // A timeout surfaces as an AbortError; translate it into a message a user can act on.
    if (e instanceof DOMException && e.name === 'AbortError') throw new TimeoutError();
    throw e instanceof Error ? e : new Error('Network request failed');
  } finally {
    clearTimeout(timer);
  }
}

// ── Fetcher ────────────────────────────────────────────────────────────────
export const fetcher = async (url: string) => {
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message ?? 'Request failed');
  }
  const json = await res.json();
  return json.data ?? json;
};

// ── Practice fetcher — preserves { data, meta } for pagination ─────────────
const practiceFetcher = async (url: string) => {
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message ?? 'Request failed');
  }
  const json = await res.json();
  return {
    data: (json.data ?? []) as unknown[],
    meta: (json.meta ?? null) as { page: number; limit: number; total: number; totalPages: number } | null,
  };
};

// ── Mutations ──────────────────────────────────────────────────────────────
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Mutations get the same timeout guarantee as reads — a hung POST otherwise
  // leaves the caller's "submitting" flag stuck and the button disabled forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      credentials: 'include',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...((options.headers as object) || {}) },
      ...options,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw new TimeoutError();
    throw e instanceof Error ? e : new Error('Network request failed');
  } finally {
    clearTimeout(timer);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message ?? 'Request failed');
  }
  return (json.data ?? json) as T;
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR('/api/dashboard', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5_000, // reduced from 30s so roadmap additions are reflected quickly
  });
  return { data, error, isLoading, mutate };
}

// ── Profile ────────────────────────────────────────────────────────────────
export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/me', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  return { data, error, isLoading, mutate };
}

export async function updateProfile(updates: Record<string, unknown>) {
  const result = await apiFetch('/api/user/me', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  await globalMutate('/api/user/me');
  return result;
}

export function usePlatformProfiles() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/me', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });
  const handles = (data?.user?.platformHandles || data?.platformHandles || {}) as Record<string, string>;
  const stats = (data?.user?.platformStats || data?.platformStats || {}) as Record<string, any>;
  return {
    data: { handles, stats },
    isLoading,
    error,
    mutate,
  };
}

export function useQuestion(id: string | null) {
  return useSWR(id ? `/api/questions/${id}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}

export async function savePlatformHandle(platform: string, handle: string | null) {
  const result = await apiFetch('/api/user/me', {
    method: 'PATCH',
    body: JSON.stringify({
      platformHandles: {
        [platform]: handle,
      },
    }),
  });
  await globalMutate('/api/user/me');
  return result;
}

export async function resetOnboarding() {
  const result = await apiFetch('/api/user/me/onboarding/reset', { method: 'POST' });
  await globalMutate('/api/user/me');
  return result;
}

export async function resetRoadmap() {
  const result = await apiFetch('/api/user/me/roadmap/reset', { method: 'POST' });
  await globalMutate('/api/user/me/roadmap');
  return result;
}

// ── Roadmap ────────────────────────────────────────────────────────────────
export function useRoadmap() {
  return useSWR('/api/user/me/roadmap', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}

export async function addRoadmapCompany(data: { companySlug: string; targetRole: string; preparationWeeks: number; topicSelfRatings?: Record<string, number> }) {
  const result = await apiFetch('/api/user/me/roadmap', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  // Revalidate both roadmap AND dashboard so the new company is instantly visible
  // on the home page without requiring a manual page refresh.
  await Promise.all([
    globalMutate('/api/user/me/roadmap'),
    globalMutate('/api/dashboard'),
  ]);
  return result;
}

// ── Progress ───────────────────────────────────────────────────────────────
export function useProgress() {
  return useSWR('/api/progress', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}

/** Role-specific topic frequency for a company — powers real Focus Areas. */
export function useCompanyTopics(slug: string | null, role?: string) {
  const qs = role ? `?role=${encodeURIComponent(role)}` : '';
  return useSWR(slug ? `/api/companies/${slug}/topics${qs}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });
}

/** Personal practice analytics for the Progress page "Practice" tab. */
export function usePracticeMyStats() {
  return useSWR('/api/practice/my-stats', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  });
}

// ── Notifications ──────────────────────────────────────────────────────────
export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR('/api/notifications', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 15_000, // near real-time: poll every 15s (SWR pauses while tab hidden)
    dedupingInterval: 5_000,
  });
  return { data, error, isLoading, mutate };
}

/**
 * Unread notification badge count.
 * Kept in lock-step with the notifications list: any mark-as-read action
 * mutates this key too, so the badge can never drift out of sync with
 * "Mark as read" buttons.
 */
const UNREAD_COUNT_KEY = '/api/notifications/unread-count';

export function useUnreadNotificationCount(): number {
  const { data } = useSWR(UNREAD_COUNT_KEY, fetcher, {
    refreshInterval: 10_000,
    dedupingInterval: 5_000,
    revalidateOnFocus: true,
  });
  return data?.unreadCount ?? 0;
}

export async function markNotificationRead(id: string) {
  await apiFetch(`/api/notifications/${id}`, { method: 'PATCH' });
  // Revalidate BOTH the list and the badge so they can never drift apart.
  await Promise.all([
    globalMutate('/api/notifications'),
    globalMutate(UNREAD_COUNT_KEY),
  ]);
}

export async function markAllNotificationsRead() {
  // Optimistically zero the badge for instant feedback…
  globalMutate(UNREAD_COUNT_KEY, { unreadCount: 0 }, { revalidate: false });
  await apiFetch('/api/notifications/read-all', { method: 'POST' });
  // …then confirm with fresh data for both badge and list.
  await Promise.all([
    globalMutate('/api/notifications'),
    globalMutate(UNREAD_COUNT_KEY),
  ]);
}

// ── Doubts ─────────────────────────────────────────────────────────────────
export function useDoubts() {
  return useSWR('/api/doubts', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  });
}

export async function createDoubt(data: {
  subject: string;
  body: string;
  tag: string;
  assignedFacultyId?: string;
}) {
  const result = await apiFetch('/api/doubts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await globalMutate('/api/doubts');
  return result;
}

export async function resolveDoubt(id: string) {
  // BUG-F FIX: Call API first, then revalidate. The calling page handles
  // optimistic local state; globalMutate here triggers a re-fetch that can
  // race and overwrite the optimistic update. Delay revalidation until after
  // the API confirms success to prevent flicker.
  const result = await apiFetch(`/api/doubts/${id}/resolve`, { method: 'PATCH' });
  // Revalidate after success so the list stays fresh without causing a flash
  await globalMutate('/api/doubts');
  return result;
}

// ── Sessions ───────────────────────────────────────────────────────────────
export function useSessions() {
  return useSWR('/api/sessions', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
    refreshInterval: 15_000, // BUG-FIX C1: poll so faculty-side status changes appear within ~15s
  });
}

export async function bookSession(data: {
  facultyId: string;
  topic: string;
  notes?: string;
  requestedDate: string;
  requestedTime: string;
  durationMin?: number;
}) {
  const result = await apiFetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await globalMutate('/api/sessions');
  return result;
}

export async function updateSessionStatus(id: string, action: 'accept_proposal' | 'cancel') {
  const result = await apiFetch(`/api/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
  await globalMutate('/api/sessions');
  return result;
}

// ── Experiences ─────────────────────────────────────────────────────────────
export function useExperiences() {
  return useSWR('/api/experiences', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  });
}

export async function submitExperience(data: Record<string, unknown>) {
  const result = await apiFetch('/api/experiences', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  await globalMutate('/api/experiences');
  return result;
}

// ── Leaderboard ─────────────────────────────────────────────────────────────
export function useLeaderboard(options?: { batch?: string; period?: string; search?: string }) {
  const params = new URLSearchParams();
  if (options?.batch) params.set('batch', options.batch);
  if (options?.period && options.period !== 'alltime') params.set('period', options.period);
  if (options?.search?.trim()) params.set('search', options.search.trim());
  const qs = params.toString();
  const key = qs ? `/api/leaderboard?${qs}` : '/api/leaderboard';
  return useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
    // keepPreviousData: switching period/search keeps the old table visible
    // with a subtle "Updating…" pill instead of flashing to an empty spinner.
    keepPreviousData: true,
  });
}

// ── Companies ───────────────────────────────────────────────────────────────
export function useCompanies() {
  return useSWR('/api/companies', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000, // company list rarely changes
  });
}

export function useCompany(slug: string | null) {
  return useSWR(slug ? `/api/companies/${slug}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });
}

// ── Practice ───────────────────────────────────────────────────────────────
export function usePractice(filters: {
  topic?: string;
  difficulty?: string;
  company?: string;
  roundType?: string;
  questionType?: string;
  isMcq?: boolean;
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const qs = new URLSearchParams();
  if (filters.topic) qs.append("topic", filters.topic);
  if (filters.difficulty) qs.append("difficulty", filters.difficulty);
  if (filters.company) qs.append("company", filters.company);
  if (filters.roundType) qs.append("roundType", filters.roundType);
  if (filters.questionType) qs.append("questionType", filters.questionType);
  if (filters.isMcq !== undefined) qs.append("isMcq", String(filters.isMcq));
  if (filters.page) qs.append("page", String(filters.page));
  if (filters.limit) qs.append("limit", String(filters.limit));

  const key = filters.enabled === false ? null : `/api/practice?${qs.toString()}`;
  return useSWR(key, practiceFetcher, {
    // keepPreviousData: changing filters/page keeps the current list rendered
    // instead of flashing empty while the new page loads (10k-user polish).
    keepPreviousData: true,
  });
}

export function useTopics() {
  return useSWR('/api/topics', fetcher);
}

export function usePracticeStats() {
  return useSWR('/api/practice/stats', fetcher);
}

export function usePracticeCategories() {
  return useSWR('/api/practice/categories', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });
}

/**
 * Set of question IDs this student has already completed.
 * Used to render ✓ Solved state in Practice and Roadmap and to prevent
 * duplicate completion submissions.
 */
export function useCompletedQuestions() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/me/completed-questions', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
  const set = new Set<string>(
    ((data?.completedQuestions ?? []) as { questionId: string }[]).map(c => c.questionId)
  );
  return { completedSet: set, isLoading, error, mutate };
}

export async function completeQuestion(questionId: string, roadmapId?: string) {
  const result = await apiFetch(`/api/questions/${questionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ roadmapId }),
  });
  // Revalidate progress + roadmap + profile after completion
  await Promise.all([
    globalMutate('/api/progress'),
    globalMutate('/api/user/me/roadmap'),
    globalMutate('/api/dashboard'),
    globalMutate('/api/user/me'), // BUG-FIX A2: update navbar XP badge immediately
  ]);
  return result;
}

// ── Change Password ────────────────────────────────────────────────────────
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Complete Onboarding ────────────────────────────────────────────────────
export async function submitOnboarding(data: {
  targetDomains: string[];
  targetCategories: string[];
  topicSelfRatings: Record<string, number>;
  targetCompanySlugs: string[];
  prepWeeksCommitted: number;
  targetRole: string;
}) {
  return apiFetch('/api/user/me/onboarding', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
