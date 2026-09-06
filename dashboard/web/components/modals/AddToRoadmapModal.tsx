"use client";
import { useState, useEffect } from "react";
import { X, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addRoadmapCompany } from "@/lib/hooks";
import { TARGET_ROLES } from "placeprep-backend/src/constants/roles";

interface ApiTopic {
  topicSlug: string;
  topicName: string;
  frequencyPct: number;
  questionCount: number;
}

const WEEK_OPTIONS = [4, 8, 12, 16, 24];

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

  const [topics, setTopics] = useState<ApiTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // Fetch role-specific topics whenever role or company changes
  useEffect(() => {
    if (!company) return;
    let cancelled = false;
    setLoadingTopics(true);
    fetch(`/api/companies/${company.slug}/topics?role=${encodeURIComponent(role)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const fetched: ApiTopic[] = Array.isArray(d.data) ? d.data : [];
        setTopics(fetched);
        setRatings((prev) => {
          const next: Record<string, number> = {};
          fetched.forEach((t) => { next[t.topicSlug] = prev[t.topicSlug] ?? 5; });
          return next;
        });
      })
      .catch(() => { if (!cancelled) setTopics([]); })
      .finally(() => { if (!cancelled) setLoadingTopics(false); });
    return () => { cancelled = true; };
  }, [role, company]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!company) return null;

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
    } catch (err: any) {
      toast.error(err?.message || "Failed to add company to roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative"
          style={{ animation: "fadeInUp 0.2s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {added ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <div className="font-bold text-gray-900 text-lg">Added to Roadmap!</div>
              <div className="text-sm text-gray-500 mt-1">
                {company.name} — {weeks}-week plan for {role}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?sz=64&domain=${company.slug}.com`}
                  alt={company.name}
                  className="w-12 h-12 rounded-xl shrink-0 object-contain bg-white border border-gray-100 p-1 shadow-sm"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?sz=64&domain=example.com"; }}
                />
                <div>
                  <div className="font-bold text-gray-900 text-lg">{company.name}</div>
                  <div className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    {company.type}
                  </div>
                </div>
              </div>

              <h2 className="text-base font-bold text-gray-900 mb-1">Add to My Roadmap</h2>
              <p className="text-sm text-gray-500 mb-4">
                Rate your confidence so we can prioritise the right topics first.
              </p>

              {/* Role selector */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Target Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Topic self-ratings */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 mb-2 block">
                  Confidence by topic (1 = beginner · 10 = expert)
                </label>
                {loadingTopics ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading topics…
                  </div>
                ) : topics.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">
                    No topic data for this role yet — roadmap will be built by frequency only.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {topics.map((topic) => (
                      <div key={topic.topicSlug} className="flex items-center gap-2">
                        <span className="w-28 text-xs text-gray-700 shrink-0 truncate">
                          {topic.topicName}
                        </span>
                        <input
                          type="range" min="1" max="10" step="1"
                          value={ratings[topic.topicSlug] ?? 5}
                          onChange={(e) =>
                            setRatings((prev) => ({
                              ...prev,
                              [topic.topicSlug]: parseInt(e.target.value),
                            }))
                          }
                          className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="w-5 text-right text-blue-600 font-bold text-xs shrink-0">
                          {ratings[topic.topicSlug] ?? 5}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Week picker */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Commitment Period
                </label>
                <div className="flex gap-2 flex-wrap">
                  {WEEK_OPTIONS.map((w) => (
                    <button
                      key={w}
                      onClick={() => setWeeks(w)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        weeks === w ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {w} weeks
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  That&apos;s ~{Math.round((weeks * 7) / 5)} working days · {Math.round(weeks * 5)} questions total
                </p>
              </div>

              <button
                onClick={handleAdd}
                disabled={loading || added}
                className="w-full bg-blue-700 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                ) : added ? "Added ✓" : `Add ${company.name} to My Roadmap →`}
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
