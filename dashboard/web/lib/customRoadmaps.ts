/**
 * dashboard/web/lib/customRoadmaps.ts
 * Student-side client for faculty/admin authored roadmaps.
 *
 * Separate from lib/staff/customRoadmaps, which drives the authoring screens
 * against /api/staff. Students only ever browse, follow and read.
 */

import useSWR from "swr";
import { fetcher } from "@/lib/hooks";

export interface CustomRoadmapCard {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  companySlugs: string[];
  companyNames: string[];
  weekCount: number;
  questionCount: number;
  followerCount: number;
  createdByName: string;
  isFollowing: boolean;
  /** Closed to new followers; still readable by those already following. */
  isRetired: boolean;
  pctComplete: number;
  doneQuestions: number;
}

export interface CustomRoadmapQuestion {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  questionType: string;
  isMcq: boolean;
  companyName: string | null;
  /** Came from the company-less pool — a LeetCode-style question staff added. */
  isExternal: boolean;
  practiceUrl: string | null;
  xp: number;
}

export interface CustomRoadmapDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  companySlugs: string[];
  companyNames: string[];
  createdByName: string;
  followerCount: number;
  isFollowing: boolean;
  isRetired: boolean;
  weeks: Array<{
    weekNumber: number;
    label: string;
    questions: CustomRoadmapQuestion[];
  }>;
  progress: {
    totalQuestions: number;
    doneQuestions: number;
    pctComplete: number;
    weeks: Array<{
      weekNumber: number;
      label: string;
      total: number;
      done: number;
      pct: number;
    }>;
  };
  completedQuestionIds: string[];
}

export function useCustomRoadmaps() {
  return useSWR<CustomRoadmapCard[]>(
    "/api/custom-roadmaps",
    (url: string) => fetcher(url).then((d) => d.roadmaps ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
}

export function useCustomRoadmap(slug: string | null) {
  return useSWR<CustomRoadmapDetail>(
    slug ? `/api/custom-roadmaps/${slug}` : null,
    (url: string) => fetcher(url).then((d) => d.roadmap),
    { revalidateOnFocus: false }
  );
}

async function mutateFollow(slug: string, method: "POST" | "DELETE") {
  const res = await fetch(`/api/custom-roadmaps/${slug}/follow`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? "Could not update. Please try again.");
  }
  return json.data as { isFollowing: boolean; followerCount: number };
}

export const followRoadmap = (slug: string) => mutateFollow(slug, "POST");
export const unfollowRoadmap = (slug: string) => mutateFollow(slug, "DELETE");
