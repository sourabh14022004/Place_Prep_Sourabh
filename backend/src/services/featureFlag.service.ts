/**
 * backend/src/services/featureFlag.service.ts
 * Central source of truth for portal feature toggles.
 *
 * Admin portal  → setMany()   (write)
 * Student/Faculty portals → getMap()/isEnabled() (read, 30s in-memory cache
 * so per-request API checks don't hammer MongoDB).
 */

import { featureFlagRepository, FeatureFlagDefinition } from '../repositories/featureFlag.repository';
import { IFeatureFlag } from '../models/FeatureFlag';
import { ApiError } from '../utils/apiError';

/**
 * The canonical flag registry. Adding a new togglable feature = add one entry
 * here; it is auto-seeded (enabled) on first read and shows up in the admin UI.
 */
export const DEFAULT_FEATURES: FeatureFlagDefinition[] = [
  // ── Student portal ──────────────────────────────────────────────
  {
    key: 'student.companies',
    portal: 'student',
    label: 'Company Intel',
    description: 'Company database, interview trends and company-wise practice.',
    group: 'Learning',
  },
  {
    key: 'student.roadmap',
    portal: 'student',
    label: 'My Roadmap',
    description: 'Personalised week-by-week preparation roadmaps.',
    group: 'Learning',
  },
  {
    key: 'student.practice',
    portal: 'student',
    label: 'Practice Zone',
    description: 'Question bank with topic/difficulty/company filters.',
    group: 'Learning',
  },
  {
    key: 'student.progress',
    portal: 'student',
    label: 'My Progress',
    description: 'Readiness, topic mastery, activity heatmap and stats.',
    group: 'Learning',
  },
  {
    key: 'student.leaderboard',
    portal: 'student',
    label: 'Leaderboard',
    description: 'XP ranking across the batch.',
    group: 'Engagement',
  },
  {
    key: 'student.experience',
    portal: 'student',
    label: 'Interview Experiences',
    description: 'Read and submit interview experience posts.',
    group: 'Engagement',
  },
  {
    key: 'student.faculty_connect',
    portal: 'student',
    label: 'Faculty Connect (master)',
    description:
      'Master switch for EVERYTHING faculty-related in the student portal: Ask a Doubt, Book a Session, Faculty Messages and faculty directory.',
    group: 'Faculty Connect',
  },
  {
    key: 'student.doubts',
    portal: 'student',
    label: 'Ask a Doubt',
    description: 'Student-to-faculty doubt threads.',
    group: 'Faculty Connect',
  },
  {
    key: 'student.sessions',
    portal: 'student',
    label: 'Book a Session',
    description: '1:1 mentoring session bookings with faculty.',
    group: 'Faculty Connect',
  },
  {
    key: 'student.messages',
    portal: 'student',
    label: 'Faculty Messages',
    description: 'Direct messaging between students and faculty.',
    group: 'Faculty Connect',
  },
  {
    key: 'student.notifications',
    portal: 'student',
    label: 'Notifications',
    description: 'In-app notification feed and bell badge.',
    group: 'Engagement',
  },

  // ── Faculty portal ──────────────────────────────────────────────
  {
    key: 'faculty.portal',
    portal: 'faculty',
    label: 'Faculty Portal (master)',
    description:
      'Master switch for the ENTIRE Faculty Portal. When off, faculty cannot access any page of their portal and students see no faculty features.',
    group: 'Access',
  },
  {
    key: 'faculty.sessions',
    portal: 'faculty',
    label: 'Session Requests',
    description: 'Accept/decline/propose mentoring session requests.',
    group: 'Mentorship',
  },
  {
    key: 'faculty.doubts',
    portal: 'faculty',
    label: 'Doubts & Questions',
    description: 'Reply to and resolve student doubts.',
    group: 'Mentorship',
  },
  {
    key: 'faculty.students',
    portal: 'faculty',
    label: 'Student Matrix',
    description: 'Assigned-student progress matrix.',
    group: 'Insights',
  },
  {
    key: 'faculty.leaderboard',
    portal: 'faculty',
    label: 'Leaderboard View',
    description: 'View the student XP leaderboard.',
    group: 'Insights',
  },
  {
    key: 'faculty.rankings',
    portal: 'faculty',
    label: 'Company Rankings',
    description: 'Aggregated company difficulty rankings.',
    group: 'Insights',
  },
  {
    key: 'faculty.curriculum',
    portal: 'faculty',
    label: 'Curriculum Gap',
    description: 'Curriculum vs industry demand gap analysis.',
    group: 'Insights',
  },
  {
    key: 'faculty.trends',
    portal: 'faculty',
    label: 'Industry Trends',
    description: 'Hiring trend analytics across companies.',
    group: 'Insights',
  },
  {
    key: 'faculty.reports',
    portal: 'faculty',
    label: 'Export Reports',
    description: 'CSV/report exports for faculty.',
    group: 'Insights',
  },
];

/** Short-TTL cache so isEnabled() can be called on every API request safely. */
let cache: { map: Record<string, boolean>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

function invalidateCache() {
  cache = null;
}

export const featureFlagService = {
  /** Seed any missing flags (idempotent) then return all flags. */
  async getAll(): Promise<IFeatureFlag[]> {
    await featureFlagRepository.upsertMany(DEFAULT_FEATURES);
    return featureFlagRepository.findAll();
  },

  /**
   * RESILIENT READ: returns every flag in the canonical registry with its
   * stored enabled state. The DB stores ONLY overrides — if the collection is
   * empty, partial, or was wiped, this still yields the complete list
   * (defaulting to enabled). This is what the admin UI renders.
   */
  async getRegistryState(): Promise<
    (FeatureFlagDefinition & { _id?: string; enabled: boolean; updatedAt?: Date })[]
  > {
    const docs = await featureFlagRepository.findAll();
    const byKey = new Map(docs.map((d) => [d.key, d]));
    return DEFAULT_FEATURES.map((def) => {
      const doc = byKey.get(def.key);
      return {
        ...def,
        ...(doc ? { _id: String(doc._id), updatedAt: doc.updatedAt } : {}),
        enabled: doc?.enabled ?? true,
      };
    });
  },

  /** key → enabled map (cached 30s). Missing keys default to true (fail-open). */
  async getMap(): Promise<Record<string, boolean>> {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.map;
    await featureFlagRepository.upsertMany(DEFAULT_FEATURES); // self-heal missing flags
    const docs = await featureFlagRepository.findAll();
    const map: Record<string, boolean> = {};
    for (const d of DEFAULT_FEATURES) map[d.key] = true; // fail-open defaults
    for (const doc of docs) map[doc.key] = doc.enabled;
    cache = { map, fetchedAt: Date.now() };
    return map;
  },

  async isEnabled(key: string): Promise<boolean> {
    const map = await this.getMap();
    return map[key] ?? true;
  },

  /**
   * Throws when a feature is toggled off — call from route handlers to
   * enforce flags at the API layer, not just in the UI.
   */
  async assertEnabled(key: string): Promise<void> {
    const ok = await this.isEnabled(key);
    if (!ok) {
      throw ApiError.forbidden('This feature has been disabled by the administrator.');
    }
  },

  async setMany(updates: { key: string; enabled: boolean }[]): Promise<Record<string, boolean>> {
    const validKeys = new Set(DEFAULT_FEATURES.map((d) => d.key));
    for (const u of updates) {
      if (!validKeys.has(u.key)) continue; // silently ignore unknown keys
      if (typeof u.enabled !== 'boolean') continue;
      await featureFlagRepository.setEnabled(u.key, u.enabled);
    }
    invalidateCache();
    return this.getMap();
  },
};
