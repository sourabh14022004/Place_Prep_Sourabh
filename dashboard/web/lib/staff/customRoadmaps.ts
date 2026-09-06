/**
 * dashboard/web/lib/staff/customRoadmaps.ts
 * API client for the custom-roadmap builder.
 *
 * Lives under lib/staff (not lib/faculty or lib/admin) because both roles use
 * the same screens against the same /api/staff endpoints.
 */

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const fieldErrors = json?.error?.details;
    const firstField =
      fieldErrors && typeof fieldErrors === "object"
        ? Object.values(fieldErrors as Record<string, string[]>).flat().find(Boolean)
        : undefined;
    throw new Error(firstField || json?.error?.message || `Request failed (${res.status})`);
  }
  return json.data as T;
}

// ── types ───────────────────────────────────────────────────────────────

export type RoadmapStatus = "draft" | "published" | "retired";

export interface StaffCompany {
  slug: string;
  name: string;
  logoUrl: string | null;
  questionCount: number;
}

export interface PoolQuestion {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  questionType: string;
  isMcq: boolean;
  roundType: string;
  companySlug: string | null;
  companyName: string | null;
  practiceUrl: string | null;
  frequency: number | null;
}

export interface RoadmapSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: RoadmapStatus;
  companySlugs: string[];
  companyNames: string[];
  weekCount: number;
  questionCount: number;
  followerCount: number;
  createdByName: string;
  isMine: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface HydratedWeek {
  weekNumber: number;
  label: string;
  questions: Array<{
    _id: string;
    problemSummary: string;
    difficulty: "Easy" | "Medium" | "Hard";
    topics?: string[];
    questionType?: string;
    isMcq?: boolean;
    companySlug?: string | null;
    companyName?: string | null;
    leetcodeUrl?: string | null;
    sourceUrl?: string | null;
    xpValue?: number;
  }>;
}

export interface RoadmapDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: RoadmapStatus;
  companySlugs: string[];
  companyNames: string[];
  followerCount: number;
  createdByName: string;
  publishedAt: string | null;
  weeks: HydratedWeek[];
}

export interface WeekPayload {
  weekNumber: number;
  label: string;
  questionIds: string[];
}

export interface UnpublishPreview {
  title: string;
  status: RoadmapStatus;
  followerCount: number;
  options: Record<
    "retire" | "remove",
    { label: string; effect: string; destructive?: boolean }
  >;
}

// ── calls ───────────────────────────────────────────────────────────────

export const getCompanies = (search?: string) =>
  api<{ companies: StaffCompany[] }>(
    `/api/staff/companies${search ? `?search=${encodeURIComponent(search)}` : ""}`
  ).then((d) => d.companies);

export const getCompanyQuestions = (params: {
  companies: string[];
  topic?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
}) => {
  const qs = new URLSearchParams({ companies: params.companies.join(",") });
  if (params.topic) qs.set("topic", params.topic);
  if (params.difficulty) qs.set("difficulty", params.difficulty);
  if (params.search) qs.set("search", params.search);
  qs.set("limit", String(params.limit ?? 200));
  return api<{
    questions: PoolQuestion[];
    returned: number;
    totalsByCompany: Record<string, number>;
  }>(`/api/staff/company-questions?${qs.toString()}`);
};

export const listRoadmaps = () =>
  api<{ roadmaps: RoadmapSummary[] }>("/api/staff/custom-roadmaps").then((d) => d.roadmaps);

export const getRoadmap = (id: string) =>
  api<{ roadmap: RoadmapDetail }>(`/api/staff/custom-roadmaps/${id}`).then((d) => d.roadmap);

export const createRoadmap = (body: {
  title: string;
  description?: string;
  weeks: WeekPayload[];
}) =>
  api<{ roadmap: { id: string; slug: string; status: RoadmapStatus } }>(
    "/api/staff/custom-roadmaps",
    { method: "POST", body: JSON.stringify(body) }
  ).then((d) => d.roadmap);

export const updateRoadmap = (
  id: string,
  body: { title?: string; description?: string; weeks?: WeekPayload[] }
) =>
  api<{ roadmap: { id: string; slug?: string; status?: RoadmapStatus } }>(
    `/api/staff/custom-roadmaps/${id}`,
    { method: "PATCH", body: JSON.stringify(body) }
  );

export const publishRoadmap = (id: string) =>
  api<{ roadmap: { id: string; slug: string; status: RoadmapStatus } }>(
    `/api/staff/custom-roadmaps/${id}/publish`,
    { method: "POST" }
  );

export const getUnpublishPreview = (id: string) =>
  api<UnpublishPreview>(`/api/staff/custom-roadmaps/${id}/unpublish`);

export const unpublishRoadmap = (id: string, mode: "retire" | "remove") =>
  api<{ mode: string; removedFollows: number }>(
    `/api/staff/custom-roadmaps/${id}/unpublish`,
    { method: "POST", body: JSON.stringify({ mode }) }
  );

export const createExternalQuestion = (body: {
  problemSummary: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  questionType?: string;
  roundType?: string;
  leetcodeUrl?: string;
  sourceUrl?: string;
  source?: string;
  explanation?: string;
}) =>
  api<{ question: { id: string; title: string; difficulty: string; xp: number } }>(
    "/api/staff/questions",
    { method: "POST", body: JSON.stringify(body) }
  ).then((d) => d.question);
