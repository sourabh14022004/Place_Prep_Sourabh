"use client";
import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Search, X, Monitor, Building, Calculator, Users, Zap, GraduationCap, Target, FileText, HelpCircle, SearchX, MousePointerClick, Flame } from "lucide-react";

const IconMap: Record<string, React.ElementType> = {
  Monitor, Building, Calculator, Users, Zap, GraduationCap, Target, FileText
};
import {
  practiceCategories,
  filterQuestions,
  allTopics,
  allCompanySlugs,
  type PracticeCategory,
  type Difficulty,
} from "@/lib/mock-data";

// ── Difficulty badge colours ─────────────────────────
const diffBadge = (d: string) =>
  d === "Easy"   ? "bg-green-50 text-green-700 border border-green-200" :
  d === "Medium" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                   "bg-red-50 text-red-600 border border-red-200";

// ── Category card component ──────────────────────────
function CategoryCard({
  cat,
  active,
  onClick,
}: {
  cat: PracticeCategory;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md group ${
        active
          ? "border-blue-500 bg-blue-50 shadow-md"
          : `${cat.color} ${cat.borderColor} hover:border-blue-300`
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-gray-700">
          {(() => {
            const Icon = IconMap[cat.iconName] || HelpCircle;
            return <Icon className="w-6 h-6" />;
          })()}
        </span>
        {active && (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">
            ACTIVE
          </span>
        )}
      </div>
      <div className={`font-bold text-base mb-1 ${active ? "text-blue-700" : cat.textColor}`}>
        {cat.label}
      </div>
      <div className="text-xs text-gray-500 mb-3 line-clamp-2">{cat.description}</div>
      <div className={`text-xs font-semibold ${active ? "text-blue-600" : cat.textColor}`}>
        {cat.totalQuestions.toLocaleString()}+ questions
      </div>
    </button>
  );
}

// ── Main practice content (needs Suspense for useSearchParams) ──
function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Which category is active (from URL or selection)
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get("category") ?? (searchParams.get("company") ? "dsa" : null)
  );

  // Filters — only 3 as per design
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [company, setCompany] = useState(searchParams.get("company") ?? "");
  const [topic, setTopic] = useState(searchParams.get("topic") ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty | "">(
    (searchParams.get("difficulty") as Difficulty) ?? ""
  );

  const [backendQuestions, setBackendQuestions] = useState<any[]>([]);

  useEffect(() => {
    async function loadLiveQuestions() {
      try {
        const res = await fetch("http://localhost:5050/api/questions?limit=500");
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data) && json.data.length > 0) {
            setBackendQuestions(json.data);
          }
        }
      } catch (err) {
        console.warn("Backend unavailable for global practice questions:", err);
      }
    }
    loadLiveQuestions();
  }, []);

  // Sync URL when category changes
  useEffect(() => {
    if (activeCategory) {
      const params = new URLSearchParams();
      params.set("category", activeCategory);
      if (search) params.set("search", search);
      if (company) params.set("company", company);
      if (topic) params.set("topic", topic);
      if (difficulty) params.set("difficulty", difficulty);
      router.replace(`/practice?${params.toString()}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const activeCat = practiceCategories.find((c) => c.id === activeCategory);

  // Filter questions based on active category + user filters
  const filteredQuestions = useMemo(() => {
    if (!activeCat) return [];
    let qs = backendQuestions.length > 0
      ? backendQuestions
      : filterQuestions({
          company: company || undefined,
          topic: topic || undefined,
          difficulty: difficulty || undefined,
          search: search || undefined,
        });

    if (search) {
      const s = search.toLowerCase();
      qs = qs.filter((q) => (q.title || q.problemSummary || "").toLowerCase().includes(s));
    }
    if (company && company !== "All") {
      const c = company.toLowerCase();
      qs = qs.filter((q) => (q.companySlug || "").toLowerCase().includes(c) || (q.companyName || "").toLowerCase().includes(c));
    }
    if (topic && topic !== "All") {
      const t = topic.toLowerCase();
      qs = qs.filter((q) => {
        const qTopic = Array.isArray(q.topics) ? q.topics.join(" ") : (q.topic || "");
        return qTopic.toLowerCase().includes(t);
      });
    }
    if (difficulty && difficulty !== "All") {
      qs = qs.filter((q) => (q.difficulty || q.diff || "").toLowerCase() === difficulty.toLowerCase());
    }

    // Keep only questions matching this category's roundTypes
    return qs.filter((q) => activeCat.roundTypes.includes(q.roundType || "Coding"));
  }, [activeCat, backendQuestions, company, topic, difficulty, search]);

  const handleSelectCategory = (id: string) => {
    setActiveCategory((prev) => (prev === id ? null : id));
    // Reset filters when changing category
    setSearch("");
    setCompany("");
    setTopic("");
    setDifficulty("");
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Practice Zone</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose a category to start practising. Use filters to narrow down questions.
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {practiceCategories.map((cat) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            active={activeCategory === cat.id}
            onClick={() => handleSelectCategory(cat.id)}
          />
        ))}
      </div>

      {/* Question list panel — shown only when a category is selected */}
      {activeCat && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
            <button
              onClick={() => setActiveCategory(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close category"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-700">
              {(() => {
                const Icon = IconMap[activeCat.iconName] || HelpCircle;
                return <Icon className="w-5 h-5" />;
              })()}
            </span>
            <div>
              <div className="font-bold text-gray-900 text-sm">{activeCat.label} Questions</div>
              <div className="text-xs text-gray-500">{filteredQuestions.length} results</div>
            </div>
          </div>

          {/* Filters — only 3: Search, Company, Topic, Difficulty */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Company dropdown */}
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
            >
              <option value="">All Companies</option>
              {allCompanySlugs.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>

            {/* Topic dropdown */}
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
            >
              <option value="">All Topics</option>
              {allTopics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Difficulty toggles */}
            <div className="flex gap-1">
              {(["", "Easy", "Medium", "Hard"] as const).map((d) => (
                <button
                  key={d || "all"}
                  onClick={() => setDifficulty(d as Difficulty | "")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    difficulty === d
                      ? d === "Easy"   ? "bg-green-600 text-white" :
                        d === "Medium" ? "bg-blue-600 text-white" :
                        d === "Hard"   ? "bg-red-500 text-white"   : "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {d || "All"}
                </button>
              ))}
            </div>
          </div>

          {/* Question rows */}
          {filteredQuestions.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="flex justify-center mb-3 text-gray-300">
                <SearchX className="w-12 h-12" />
              </div>
              <div className="font-medium">No questions found</div>
              <div className="text-sm mt-1">Try adjusting your filters</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredQuestions.map((q: any, idx: number) => {
                const title = q.problemSummary || q.title || "Interview Question";
                const topicStr = Array.isArray(q.topics) && q.topics.length > 0 ? q.topics.join(", ") : (q.topic || "DSA");
                const diffStr = q.difficulty || q.diff || "Medium";
                const xpVal = q.xpValue !== undefined ? q.xpValue : (q.xp || 10);
                const isHotVal = q.isHot !== undefined ? q.isHot : q.hot;
                const linkUrl = q.leetcodeUrl || q.sourceUrl;

                return (
                  <div
                    key={q._id || q.id || title || idx}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs text-gray-400 font-mono w-6 shrink-0">{idx + 1}</span>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate" title={title}>{title}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500">{topicStr}</span>
                        {(Array.isArray(q.companies) ? q.companies : [q.companySlug || q.companyName]).filter(Boolean).slice(0, 2).map((co: string, cIdx: number) => (
                          <span key={co || cIdx} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 capitalize">
                            {co}
                          </span>
                        ))}
                        {isHotVal && (
                          <span className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5"><Flame className="w-3 h-3 mr-1 inline-block" /> Hot</span>
                        )}
                      </div>
                    </div>

                    {/* Difficulty badge */}
                    <span className={`text-xs font-semibold rounded-full px-2.5 py-1 shrink-0 ${diffBadge(diffStr)}`}>
                      {diffStr}
                    </span>

                    {/* XP */}
                    <span className="text-xs font-bold text-amber-600 shrink-0">+{xpVal} XP</span>

                    {/* Link */}
                    {linkUrl ? (
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 shrink-0"
                        aria-label={`Open ${title}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <div className="w-4 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* If no category selected, show hint */}
      {!activeCategory && (
        <div className="text-center py-12 text-gray-400">
          <div className="flex justify-center mb-3 text-gray-300">
            <MousePointerClick className="w-12 h-12" />
          </div>
          <div className="font-medium text-gray-600">Select a category above to start practising</div>
          <div className="text-sm mt-1">Each category has filtered questions with difficulty & company tags</div>
        </div>
      )}
    </div>
  );
}

// Suspense wrapper required for useSearchParams in App Router
export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}
