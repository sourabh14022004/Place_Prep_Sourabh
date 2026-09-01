"use client";
import { CompanyLogo } from "@/components/ui";
import { FeatureGate } from "@/lib/features";
import { useState, useMemo, use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Search, X, SearchX, Flame } from "lucide-react";
import { useCompany, usePractice, useRoadmap } from "@/lib/hooks";
import { allTopics, type Difficulty, type RoundType, getPracticeUrl, getPlatformInfo } from "@/lib/constants";
import ErrorState from "@/components/ErrorState";

const diffBadge = (d: string) =>
  d === "Easy"   ? "bg-green-50 text-green-700 border border-green-200" :
  d === "Medium" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                   "bg-red-50 text-red-600 border border-red-200";

const roundColors: Record<string, string> = {
  "Coding":        "bg-blue-100 text-blue-700",
  "System Design": "bg-indigo-100 text-indigo-700",
  "LLD":           "bg-indigo-100 text-indigo-700",
  "HR":            "bg-green-100 text-green-700",
  "Aptitude":      "bg-slate-100 text-slate-700",
  "Domain":        "bg-gray-100 text-gray-700",
};

function CompanyPracticePageInner({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { name: slug } = use(params);
  const resolvedSearchParams = use(searchParams);
  
  const { data: companyRes, error: companyError, mutate: retryCompany } = useCompany(slug);
  const intel = companyRes?.data ?? companyRes;
  
  const { data: roadmapRes } = useRoadmap();
  const roadmaps = roadmapRes?.data?.roadmaps ?? roadmapRes?.roadmaps ?? [];
  const activeRoadmap = roadmaps.find((r: any) => r.companySlug === slug);

  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState(
    typeof resolvedSearchParams.topic === "string" ? resolvedSearchParams.topic : ""
  );
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [roundType, setRoundType] = useState<RoundType | "">("Coding");
  const [weekFilter, setWeekFilter] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 100;

  // Reset page to 1 when any filter changes
  const handleTopicChange = (val: string) => { setTopic(val); setPage(1); };
  const handleDifficultyChange = (val: Difficulty | "") => { setDifficulty(val); setPage(1); };
  const handleRoundTypeChange = (val: RoundType | "") => { setRoundType(val); setPage(1); };
  const handleSearchChange = (val: string) => { setSearch(val); setPage(1); };

  // Fetch current page from API — server-side filters
  const { data: practiceRes, isLoading: questionsLoading, error: questionsError, mutate: retryQuestions } = usePractice({
    company: slug,
    topic,
    difficulty,
    roundType: roundType || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const rawQuestions = (practiceRes?.data ?? []) as any[];
  const hasNextPage = page < (practiceRes?.meta?.totalPages ?? 1);
  const hasPrevPage = page > 1;



  const filtered = useMemo(() => {
    let list = [...rawQuestions];
    // roundType is already filtered server-side; only apply search + weekFilter locally
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((item) => item.title?.toLowerCase().includes(q));
    }
    if (weekFilter !== "" && activeRoadmap) {
      const selectedWeek = activeRoadmap.weeks.find((w: any) => w.weekNumber === Number(weekFilter));
      if (selectedWeek) {
        const weekQIds = new Set(
          selectedWeek.tasks?.map((t: any) =>
            typeof t.questionId === "object" ? t.questionId._id : t.questionId
          )
        );
        list = list.filter((item) => weekQIds.has(item._id));
      }
    }
    return list;
  }, [rawQuestions, roundType, search, weekFilter, activeRoadmap]);

  const companyBg =
    slug === "google"    ? "bg-blue-600"   :
    slug === "amazon"    ? "bg-orange-500" :
    slug === "flipkart"  ? "bg-blue-500"   :
    slug === "microsoft" ? "bg-teal-600"   :
    slug === "razorpay"  ? "bg-blue-800"   :
    slug === "tcs"       ? "bg-indigo-600" : "bg-blue-600";

  // ERROR FIX: failed fetches previously rendered the same "No questions match"
  // message as a genuine empty result — indistinguishable and unrecoverable.
  // NOTE: deliberately placed AFTER every hook so render order stays stable.
  if (questionsError) {
    return (
      <div className="max-w-5xl">
        <ErrorState
          error={questionsError}
          title="Couldn't load questions for this company"
          onRetry={() => { retryQuestions(); retryCompany(); }}
        />
      </div>
    );
  }


  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <Link href="/companies" className="hover:text-gray-700 transition-colors">Companies</Link>
        <span>/</span>
        <Link href={`/companies/${slug}`} className="hover:text-gray-700 transition-colors capitalize">{intel?.name || slug}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Practice</span>
      </div>

      {/* Company header banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
<CompanyLogo name={slug} size={32} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-lg font-bold text-gray-900">Practice for {intel?.name || slug}</h1>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${companyBg} text-white`}>
              Company-Locked
            </span>
          </div>
          <p className="text-sm text-gray-500">
            All questions below are from {intel?.name || slug} interviews only — {filtered.length} shown
          </p>
        </div>
        <Link
          href={`/companies/${slug}`}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50:bg-slate-800/60 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Intel
        </Link>
      </div>

      {/* Filters — 3 + Round (round is shown here because it's company-specific) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Topic */}
        <select
          value={topic}
          onChange={(e) => handleTopicChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
        >
          <option value="">All Topics</option>
          {allTopics.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Round type (available here since this is company-specific) */}
        <select
          value={roundType}
          onChange={(e) => handleRoundTypeChange(e.target.value as RoundType | "")}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
        >
          <option value="">All Rounds</option>
          <option value="Coding">Round: Coding/DSA</option>
          <option value="System Design">Round: System Design</option>
          <option value="LLD">Round: LLD</option>
          <option value="HR">Round: HR/Behavioral</option>
          <option value="Aptitude">Round: Aptitude/OA</option>
          <option value="Domain">Round: Domain/CS</option>
        </select>

        {/* Difficulty */}
        <div className="flex gap-1">
          {(["", "Easy", "Medium", "Hard"] as const).map((d) => (
            <button
              key={d || "all"}
              onClick={() => handleDifficultyChange(d as Difficulty | "")}
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

        {/* Week Filter (only shows if company is in roadmap) */}
        {activeRoadmap && (
          <select
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value === "" ? "" : Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
          >
            <option value="">All Weeks</option>
            {activeRoadmap.weeks.map((w: any) => (
              <option key={w.weekNumber} value={w.weekNumber}>
                Week {w.weekNumber}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Question list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="flex justify-center mb-3 text-gray-300">
              <SearchX className="w-12 h-12" />
            </div>
            <div className="font-medium">No questions match your filters</div>
            <div className="text-sm mt-1">Try adjusting the topic, round, or difficulty</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((q, idx) => (
              <div key={q.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50:bg-slate-800/60 transition-colors">
                <span className="text-xs text-gray-400 font-mono w-6 shrink-0">{idx + 1}</span>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{q.title}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {q.topic && <span className="text-xs text-gray-500">{q.topic}</span>}
                    {q.hot && <span className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5"><Flame className="w-3 h-3 mr-1 inline-block" />Hot</span>}
                    {q.frequency > 0 && (
                      <span className="text-xs text-gray-400">Asked in {q.frequency}% of interviews</span>
                    )}
                  </div>
                </div>

                {/* Round badge */}
                <span className={`text-xs font-semibold rounded-full px-2.5 py-1 shrink-0 ${roundColors[q.roundType] ?? "bg-gray-100 text-gray-700"}`}>
                  {q.roundType}
                </span>

                {/* Difficulty badge */}
                <span className={`text-xs font-semibold rounded-full border px-2.5 py-1 shrink-0 ${diffBadge(q.diff)}`}>
                  {q.diff}
                </span>

                <span className="text-xs font-bold text-amber-600 shrink-0">+{q.xp} XP</span>

                {(() => {
                  const practiceUrl = getPracticeUrl(q);
                  return practiceUrl ? (
                    <a
                      href={practiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors shrink-0 group/link"
                      title={`Solve on ${getPlatformInfo(practiceUrl).name}`}
                      aria-label={`Open ${q.title} on ${getPlatformInfo(practiceUrl).name}`}
                    >
                      <span>Solve</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                    </a>
                  ) : (
                    <div className="w-4 shrink-0" />
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prev / Next page navigation — replaces current 100 with adjacent page's 100 */}
      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-400">
            Page {page} &middot; {filtered.length} questions{!hasNextPage ? " · Last page" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={!hasPrevPage || questionsLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50:bg-slate-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-sm font-bold text-gray-700 min-w-[2rem] text-center">{page}</span>
            <button
              onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={!hasNextPage || questionsLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50:bg-slate-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-2">
        {intel?.name || slug} &middot; {roundType || "All rounds"} &middot; {questionsLoading ? "Loading..." : `${filtered.length} on page ${page}`}
      </p>
    </div>
  );
}

// Admin feature-toggle gate (Feature Controls → student.practice)
export default function CompanyPracticePageGate(props: { params: Promise<{ name: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return (
    <FeatureGate feature="student.practice" title="Practice Zone">
      <CompanyPracticePageInner {...props} />
    </FeatureGate>
  );
}
