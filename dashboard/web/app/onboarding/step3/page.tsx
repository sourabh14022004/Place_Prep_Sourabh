"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Info, Loader2, Sprout, Gauge, Rocket } from "lucide-react";
import Stepper from "@/components/onboarding/Stepper";
import { TARGET_ROLES } from "@/lib/constants";

interface ApiTopic {
  topicSlug: string;
  topicName: string;
  frequencyPct: number;
  questionCount: number;
}

const durations = ["4 weeks", "8 weeks", "12 weeks", "16 weeks", "24 weeks"];

/**
 * The new 3-level self-assessment (replaces the old confusing 1–10 sliders).
 * Levels map onto the internal 1–10 rating scale that the roadmap algorithm
 * already understands:
 *   Beginner     → 3  (weak: topic scheduled early)
 *   Intermediate → 6  (average)
 *   Advanced     → 9  (strong: topic deprioritised)
 */
export const LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    rating: 3,
    hint: "Just starting out or struggle with this topic",
    icon: Sprout,
    classes: { selected: "bg-green-600 text-white border-green-600", chip: "bg-green-50 text-green-700 border-green-200" },
  },
  {
    id: "intermediate",
    label: "Intermediate",
    rating: 6,
    hint: "Know the basics, need more practice",
    icon: Gauge,
    classes: { selected: "bg-blue-600 text-white border-blue-600", chip: "bg-blue-50 text-blue-700 border-blue-200" },
  },
  {
    id: "advanced",
    label: "Advanced",
    rating: 9,
    hint: "Confident — can solve varied problems",
    icon: Rocket,
    classes: { selected: "bg-violet-600 text-white border-violet-600", chip: "bg-violet-50 text-violet-700 border-violet-200" },
  },
] as const;

function mergeTopics(arrays: ApiTopic[][]): ApiTopic[] {
  const map = new Map<string, ApiTopic>();
  for (const arr of arrays) {
    for (const t of arr) {
      const existing = map.get(t.topicSlug);
      if (!existing || t.frequencyPct > existing.frequencyPct) {
        map.set(t.topicSlug, t);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.frequencyPct - a.frequencyPct);
}

export default function SelfRatingPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<string>(() => {
    try {
      return typeof window !== "undefined"
        ? sessionStorage.getItem("onboarding_target_role") || "SDE-1"
        : "SDE-1";
    } catch { return "SDE-1"; }
  });

  const [topics, setTopics] = useState<ApiTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  // ratings keeps the internal numeric scale so step4/API stay unchanged
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [time, setTime] = useState("12 weeks");

  // Fetch role-specific topics for each company selected in step2
  useEffect(() => {
    let cancelled = false;
    async function fetchTopics() {
      setLoadingTopics(true);
      try {
        const raw = typeof window !== "undefined" ? sessionStorage.getItem("onboarding_companies") : null;
        const slugs: string[] = raw ? JSON.parse(raw) : [];
        if (slugs.length === 0) { setTopics([]); return; }

        const results = await Promise.all(
          slugs.map((slug) =>
            fetch(`/api/companies/${slug}/topics?role=${encodeURIComponent(selectedRole)}`)
              .then((r) => r.json())
              .then((d) => (Array.isArray(d.data) ? d.data : []) as ApiTopic[])
              .catch(() => [] as ApiTopic[])
          )
        );

        if (cancelled) return;
        const merged = mergeTopics(results);
        setTopics(merged);
        // Default every topic to Intermediate; keep any previously chosen level
        setRatings((prev) => {
          const next: Record<string, number> = {};
          merged.forEach((t) => { next[t.topicSlug] = prev[t.topicSlug] ?? 6; });
          return next;
        });
      } catch {
        if (!cancelled) setTopics([]);
      } finally {
        if (!cancelled) setLoadingTopics(false);
      }
    }
    fetchTopics();
    return () => { cancelled = true; };
  }, [selectedRole]);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("onboarding_target_role", role);
    }
  };

  const setLevelForAll = (rating: number) => {
    const next: Record<string, number> = {};
    topics.forEach((t) => { next[t.topicSlug] = rating; });
    setRatings(next);
  };

  const counts = LEVELS.map((lv) => ({
    ...lv,
    count: topics.filter((t) => (ratings[t.topicSlug] ?? 6) === lv.rating).length,
  }));

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left brand panel */}
      <div className="hidden md:flex w-[320px] shrink-0 bg-gradient-to-br from-blue-700 to-indigo-800 flex-col justify-between px-10 py-12">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-white/20 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
            <span className="font-bold text-white text-sm">PlacePrep</span>
          </div>
          <h2 className="text-white text-3xl font-extrabold leading-tight mb-3">
            Rate your<br />confidence
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Pick a level per topic — weak topics are scheduled first in your roadmap. Be honest; you can retake this anytime.
          </p>
        </div>
        <div className="text-blue-300 text-xs">NST Placement Prep Portal · Student Edition</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col px-6 md:px-8 py-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto flex flex-col h-full">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-4">
            <div className="bg-blue-700 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
            <span className="font-bold text-gray-900 text-sm">PlacePrep</span>
          </div>

          <Stepper currentStep={3} totalSteps={5} />
          <p className="text-xs text-gray-400 mt-2 mb-3">Step 3 of 4</p>
          <h1 className="text-xl font-bold text-gray-900 mb-0.5">How confident are you in each topic?</h1>
          <p className="text-sm text-gray-500 mb-3">Pick Beginner, Intermediate or Advanced — topics fetched live from your target companies</p>

          {/* Role selector */}
          <div className="flex items-center gap-3 mb-3">
            <label className="text-xs font-semibold text-gray-600 shrink-0">Target Role</label>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              {TARGET_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3 text-xs text-blue-700">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>High-frequency topics you rate <strong>Beginner</strong> appear first in your roadmap. Advanced topics are pushed later.</span>
          </div>

          {/* Quick-set all */}
          {!loadingTopics && topics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mr-1">Set all:</span>
              {LEVELS.map((lv) => (
                <button
                  key={`all-${lv.id}`}
                  onClick={() => setLevelForAll(lv.rating)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${lv.classes.chip} hover:brightness-95`}
                >
                  {lv.label}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable inner area for topic levels */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 overflow-y-auto min-h-0">
            {loadingTopics ? (
              <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading topics…
              </div>
            ) : topics.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                No topics found for this role. Select a different role or go back to pick more companies.
              </div>
            ) : (
              <div className="space-y-3">
                {topics.map((topic) => (
                  <div
                    key={topic.topicSlug}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="sm:w-40 shrink-0">
                      <div className="text-xs font-semibold text-gray-800">{topic.topicName}</div>
                      <div className="text-[10px] text-gray-400">{topic.frequencyPct}% interview frequency</div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 flex-1">
                      {LEVELS.map((lv) => {
                        const active = (ratings[topic.topicSlug] ?? 6) === lv.rating;
                        const Icon = lv.icon;
                        return (
                          <button
                            key={lv.id}
                            type="button"
                            title={lv.hint}
                            onClick={() =>
                              setRatings((prev) => ({ ...prev, [topic.topicSlug]: lv.rating }))
                            }
                            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                              active
                                ? `${lv.classes.selected} shadow-sm scale-[1.02]`
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {lv.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Duration picker */}
            <div className="border-t border-gray-100 pt-4 mt-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">How much time do you have?</h3>
              <div className="flex flex-wrap gap-2">
                {durations.map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setTime(duration)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${time === duration ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary strip */}
          {!loadingTopics && topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-gray-500">
              {counts.map((lv) => (
                <span key={`cnt-${lv.id}`} className={`px-2 py-0.5 rounded-full border ${lv.classes.chip}`}>
                  {lv.count} {lv.label.toLowerCase()}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-4 shrink-0">
            <button
              onClick={() => router.push("/onboarding/step2")}
              className="flex-1 py-3 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("onboarding_ratings", JSON.stringify(ratings));
                  sessionStorage.setItem("onboarding_weeks", time.split(" ")[0]);
                  sessionStorage.setItem("onboarding_target_role", selectedRole);
                }
                router.push("/onboarding/step4");
              }}
              disabled={topics.length === 0}
              className="flex-1 bg-gray-900 text-white rounded-lg py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Roadmap <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
