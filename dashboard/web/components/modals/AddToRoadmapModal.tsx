"use client";
import { useState, useEffect, useTransition } from "react";
import { X, Calendar, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { addRoadmapCompany } from "@/lib/hooks";
import {
  TARGET_ROLES,
  ROLE_DEFAULT_TOPICS,
  ROLE_FOCUS_DESCRIPTIONS,
  type RoleTopicItem,
} from "@/lib/constants";

interface ApiTopic {
  topicSlug: string;
  topicName: string;
  frequencyPct: number;
  questionCount?: number;
}

const WEEK_OPTIONS = [4, 8, 12, 16, 24];

const CONFIDENCE_LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    rating: 3,
    activeClasses: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    rating: 6,
    activeClasses: "bg-blue-600 text-white border-blue-600 shadow-sm",
  },
  {
    id: "expert",
    label: "Expert",
    rating: 9,
    activeClasses: "bg-violet-600 text-white border-violet-600 shadow-sm",
  },
] as const;

interface Props {
  company: {
    slug: string;
    name: string;
    initial: string;
    color: string;
    type: string;
  } | null;
  onClose: () => void;
  onAdded: (slug: string) => void;
}

export default function AddToRoadmapModal({ company, onClose, onAdded }: Props) {
  const [weeks, setWeeks] = useState(12);
  const [role, setRole] = useState("SDE-1");
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize with role default topics so there is zero empty lag
  const [topics, setTopics] = useState<ApiTopic[]>(() => ROLE_DEFAULT_TOPICS["SDE-1"] || []);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    (ROLE_DEFAULT_TOPICS["SDE-1"] || []).forEach((t) => {
      init[t.topicSlug] = 6;
    });
    return init;
  });

  const [, startTransition] = useTransition();

  // Fetch role-specific topics whenever role or company changes
  useEffect(() => {
    if (!company) return;
    let cancelled = false;

    // Immediately show curated fallback topics for chosen role
    const fallback = ROLE_DEFAULT_TOPICS[role] || [];
    startTransition(() => {
      setTopics(fallback);
      setRatings((prev) => {
        const next: Record<string, number> = {};
        fallback.forEach((t) => {
          next[t.topicSlug] = prev[t.topicSlug] ?? 6;
        });
        return next;
      });
    });

    setLoadingTopics(true);
    fetch(`/api/companies/${company.slug}/topics?role=${encodeURIComponent(role)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const fetched: ApiTopic[] = Array.isArray(d.data) && d.data.length > 0 ? d.data : fallback;
        setTopics(fetched);
        setRatings((prev) => {
          const next: Record<string, number> = {};
          fetched.forEach((t) => {
            next[t.topicSlug] = prev[t.topicSlug] ?? 6;
          });
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setTopics(fallback);
      })
      .finally(() => {
        if (!cancelled) setLoadingTopics(false);
      });

    return () => {
      cancelled = true;
    };
  }, [role, company]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!company) return null;

  const handleSetAll = (rating: number) => {
    const next: Record<string, number> = {};
    topics.forEach((t) => {
      next[t.topicSlug] = rating;
    });
    setRatings(next);
  };

  const handleAdd = async () => {
    if (loading || added) return;
    setLoading(true);
    try {
      await addRoadmapCompany({
        companySlug: company.slug,
        targetRole: role,
        preparationWeeks: weeks,
        topicSelfRatings: Object.keys(ratings).length > 0 ? ratings : undefined,
      });
      setAdded(true);
      toast.success(`${company.name} added to your roadmap!`);
      setTimeout(() => {
        onAdded(company.slug);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add company to roadmap. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Calculate question metrics based on weeks
  const questionsPerWeek = weeks <= 4 ? 15 : weeks <= 6 ? 12 : weeks <= 8 ? 10 : weeks <= 12 ? 7 : 5;
  const totalQuestions = weeks * questionsPerWeek;
  const workingDays = Math.round((weeks * 7) / 5);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 relative my-auto border border-gray-100"
          style={{ animation: "fadeInUp 0.2s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {added ? (
            <div className="text-center py-6">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3 animate-bounce" />
              <div className="font-bold text-gray-900 text-xl">Added to Roadmap!</div>
              <div className="text-sm text-gray-500 mt-1.5 font-medium">
                {company.name} — {weeks}-week plan for <span className="text-blue-600 font-bold">{role}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?sz=64&domain=${company.slug}.com`}
                  alt={company.name}
                  className="w-11 h-11 rounded-xl shrink-0 object-contain bg-white border border-gray-100 p-1 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?sz=64&domain=example.com";
                  }}
                />
                <div>
                  <div className="font-bold text-gray-900 text-lg leading-tight">{company.name}</div>
                  <div className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    {company.type}
                  </div>
                </div>
              </div>

              <h2 className="text-base font-bold text-gray-900 mb-0.5">Add to My Roadmap</h2>
              <p className="text-xs text-gray-500 mb-4">
                Select your target role and skill standing to prioritise what you need most.
              </p>

              {/* Role selector */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Target Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50/50 hover:bg-white focus:bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition-colors cursor-pointer"
                >
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {/* Role Focus Description */}
                <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-blue-50/70 border border-blue-100/80 text-[11px] text-blue-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-medium text-blue-900 truncate">
                    {ROLE_FOCUS_DESCRIPTIONS[role] || "Role-specific interview preparation"}
                  </span>
                </div>
              </div>

              {/* Topic self-ratings */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block">
                      Confidence by topic
                    </label>
                    <span className="text-[10px] text-gray-400">
                      Beginner topics appear first in your roadmap
                    </span>
                  </div>

                  {/* Set all quick actions */}
                  {topics.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-gray-400 font-medium mr-0.5">All:</span>
                      {CONFIDENCE_LEVELS.map((lv) => (
                        <button
                          key={`all-${lv.id}`}
                          type="button"
                          onClick={() => handleSetAll(lv.rating)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 transition-colors"
                        >
                          {lv.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {loadingTopics ? (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-400 gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> Updating topics for {role}…
                  </div>
                ) : topics.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center bg-gray-50 rounded-xl">
                    No topic data for this role yet — roadmap will use default curriculum.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {topics.map((topic) => {
                      const currentRating = ratings[topic.topicSlug] ?? 6;
                      return (
                        <div
                          key={topic.topicSlug}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/70 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-800 truncate" title={topic.topicName}>
                              {topic.topicName}
                            </div>
                            {topic.frequencyPct > 0 && (
                              <div className="text-[10px] text-gray-400 font-medium">
                                {topic.frequencyPct}% frequency
                              </div>
                            )}
                          </div>

                          {/* 3 buttons: Beginner, Intermediate, Expert */}
                          <div className="flex items-center gap-1 shrink-0">
                            {CONFIDENCE_LEVELS.map((lvl) => {
                              const active = currentRating === lvl.rating;
                              return (
                                <button
                                  key={lvl.id}
                                  type="button"
                                  onClick={() =>
                                    setRatings((prev) => ({
                                      ...prev,
                                      [topic.topicSlug]: lvl.rating,
                                    }))
                                  }
                                  className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                                    active
                                      ? lvl.activeClasses
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                                  }`}
                                >
                                  {lvl.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Week picker */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Commitment Period
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {WEEK_OPTIONS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeeks(w)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        weeks === w
                          ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {w} weeks
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  That&apos;s ~{workingDays} working days · <span className="text-gray-700 font-semibold">{totalQuestions} questions</span> tailored for {role}
                </p>
              </div>

              <button
                onClick={handleAdd}
                disabled={loading || added}
                className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Adding to Roadmap...
                  </>
                ) : added ? (
                  "Added ✓"
                ) : (
                  `Add ${company.name} for ${role} →`
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

