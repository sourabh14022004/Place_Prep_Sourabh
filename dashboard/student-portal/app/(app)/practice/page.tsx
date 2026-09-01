"use client";
import { FeatureGate } from "@/lib/features";
import { PageHeader } from "@/components/ui";
import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, ExternalLink, Search, X, Monitor, Building, Calculator, Users, Zap,
  GraduationCap, FileText, HelpCircle, SearchX, MousePointerClick, Flame,
  CheckCircle2, Circle, Lightbulb, BookOpenCheck,
} from "lucide-react";

const IconMap: Record<string, React.ElementType> = {
  Monitor, Building, Calculator, Users, Zap, GraduationCap, FileText,
};

import {
  usePractice, usePracticeCategories, useTopics, useCompanies,
  useCompletedQuestions, usePracticeMyStats, completeQuestion,
} from "@/lib/hooks";
import { type Difficulty, getPracticeUrl, getPlatformInfo } from "@/lib/constants";
import ErrorState from "@/components/ErrorState";
import { usePageTitle } from "@/lib/use-page-title";

// ── Category config (display metadata keyed by questionType) ─────────────────
interface CategoryConfig {
  label: string;
  description: string;
  iconName: string;
  color: string;
  borderColor: string;
  textColor: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  dsa:             { label: "DSA / Coding",   description: "LeetCode-style problems, algorithms & data structures", iconName: "Zap",          color: "bg-blue-50",    borderColor: "border-blue-200",   textColor: "text-blue-700"   },
  aptitude_mcq:    { label: "Aptitude",        description: "Quant, logical reasoning, verbal, and puzzles",         iconName: "Calculator",   color: "bg-slate-50",   borderColor: "border-slate-200",  textColor: "text-slate-700"  },
  core_cs_mcq:     { label: "Core CS",         description: "OS, DBMS, computer networks, OOP fundamentals",         iconName: "Monitor",      color: "bg-purple-50",  borderColor: "border-purple-200", textColor: "text-purple-700" },
  system_design:   { label: "System Design",   description: "HLD, distributed systems, scalability patterns",        iconName: "Building",     color: "bg-indigo-50",  borderColor: "border-indigo-200", textColor: "text-indigo-700" },
  lld:             { label: "LLD",             description: "Low-level design, class diagrams, design patterns",     iconName: "FileText",      color: "bg-teal-50",    borderColor: "border-teal-200",   textColor: "text-teal-700"   },
  hr_behavioral:   { label: "HR / Behavioral", description: "STAR-format, situational, cultural-fit questions",      iconName: "Users",         color: "bg-green-50",   borderColor: "border-green-200",  textColor: "text-green-700"  },
  domain_specific: { label: "Domain Specific", description: "Role-specific: frontend, ML, DevOps, and more",         iconName: "GraduationCap", color: "bg-orange-50",  borderColor: "border-orange-200", textColor: "text-orange-700" },
};

// ── Difficulty badge colours ──────────────────────────────────────────────────
const diffBadge = (d: string) =>
  d === "Easy"   ? "bg-green-50 text-green-700 border border-green-200" :
  d === "Medium" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                   "bg-red-50 text-red-600 border border-red-200";

// ── Quiz modal ───────────────────────────────────────────────────────────────
interface QuizQuestion {
  id: string;
  title: string;
  diff: string;
  topic?: string;
  companies?: string[];
  hot?: boolean;
  isMcq?: boolean;
  options?: { label: string; text: string; isCorrect: boolean }[];
  explanation?: string;
  sampleAnswer?: string;
  keyPoints?: string[];
  hints?: string[];
  leetcodeUrl?: string | null;
}

function QuizModal({
  question,
  alreadySolved,
  onClose,
}: {
  question: QuizQuestion;
  alreadySolved: boolean;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(alreadySolved);
  const [completing, setCompleting] = useState(false);
  const [solved, setSolved] = useState(alreadySolved);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isMcq = question.isMcq && question.options?.length;
  const pickedOption = question.options?.find(o => o.label === picked);
  const isCorrect = pickedOption?.isCorrect ?? false;

  const handleSubmit = async () => {
    if (!isMcq || !picked) return;
    setSubmitted(true);
    if (!isCorrect) {
      toast.error("Not quite — check the explanation below.");
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeQuestion(question.id);
      setSolved(true);
      toast.success("Marked as completed — progress updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark as completed.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal header */}
        <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <span className={`mt-0.5 shrink-0 text-xs font-semibold rounded-full px-2.5 py-1 ${diffBadge(question.diff)}`}>
            {question.diff}
          </span>
          <h3 className="flex-1 font-bold text-gray-900 leading-snug">{question.title}</h3>
          <button onClick={onClose} className="p-1 -m-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meta chips */}
        <div className="px-6 pt-3 flex items-center gap-2 flex-wrap">
          {question.topic && <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{question.topic}</span>}
          {question.companies?.slice(0, 3).map(co => (
            <span key={co} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 capitalize">{co}</span>
          ))}
          {question.hot && (
            <span className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5">
              <Flame className="w-3 h-3 mr-1 inline-block" /> Hot
            </span>
          )}
          {solved && (
            <span className="text-xs bg-green-50 text-green-700 rounded px-1.5 py-0.5 font-medium">✓ Solved</span>
          )}
          {(() => {
            const practiceUrl = getPracticeUrl(question);
            return practiceUrl ? (
              <a
                href={practiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 font-semibold"
              >
                Solve on {getPlatformInfo(practiceUrl).name} <ExternalLink className="w-3 h-3" />
              </a>
            ) : null;
          })()}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isMcq ? (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Select an answer</p>
              <div className="space-y-2">
                {question.options!.map((opt) => {
                  const isPicked = picked === opt.label;
                  const answered = submitted;
                  const showCorrect = answered && opt.isCorrect;
                  const showWrong = answered && isPicked && !opt.isCorrect;
                  return (
                    <button
                      key={opt.label}
                      disabled={answered}
                      onClick={() => setPicked(opt.label)}
                      className={`w-full flex items-start gap-3 text-sm rounded-xl px-4 py-3 border transition-all text-left ${
                        showCorrect ? "bg-green-50 border-green-400 text-green-900 ring-1 ring-green-300" :
                        showWrong   ? "bg-red-50 border-red-300 text-red-800" :
                        answered    ? "bg-white border-gray-200 text-gray-400 opacity-60" :
                        isPicked    ? "bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-200" :
                                      "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer"
                      }`}
                    >
                      <span className={`font-mono text-xs font-bold shrink-0 mt-0.5 w-5 ${showCorrect ? "text-green-600" : showWrong ? "text-red-500" : "text-gray-400"}`}>
                        {opt.label}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {showCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />}
                      {showWrong && <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              {submitted && question.explanation && (
                <div className={`mt-4 rounded-xl p-4 border ${
                  isCorrect ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
                }`}>
                  <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${isCorrect ? "text-green-700" : "text-gray-500"}`}>
                    {isCorrect ? "✓ Correct!" : "Explanation"}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{question.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-sm text-gray-700">
              {question.sampleAnswer && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Model Answer</p>
                  <p className="font-semibold text-gray-800 leading-relaxed whitespace-pre-line">{question.sampleAnswer}</p>
                </div>
              )}
              {question.explanation && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Explanation</p>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{question.explanation}</p>
                </div>
              )}
              {(question.keyPoints?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Key Points</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                    {question.keyPoints!.map((kp, i) => <li key={i}>{kp}</li>)}
                  </ul>
                </div>
              )}
              {(question.hints?.length ?? 0) > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Hints
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-amber-700/90">
                    {question.hints!.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
              {!question.sampleAnswer && !question.explanation && !question.keyPoints?.length && (
                <p className="text-xs text-gray-400 italic">
                  No written answer available — attempt it externally and mark as completed when done.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          {solved ? (
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <BookOpenCheck className="w-4 h-4" /> Completed — great job!
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              {completing ? "Saving…" : "Mark as Completed"}
            </button>
          )}
          <div className="flex-1" />
          {isMcq && !submitted && (
            <button
              onClick={handleSubmit}
              disabled={!picked}
              className="px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-100:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category card ─────────────────────────────────────────────────────────────
function CategoryCard({
  questionType, count, active, onClick,
}: {
  questionType: string; count: number; active: boolean; onClick: () => void;
}) {
  const cfg: CategoryConfig = CATEGORY_CONFIG[questionType] ?? {
    label: questionType, description: "", iconName: "HelpCircle",
    color: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-700",
  };
  const Icon = IconMap[cfg.iconName] ?? HelpCircle;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md group ${
        active
          ? "border-blue-500 bg-blue-50 shadow-md"
          : `${cfg.color} ${cfg.borderColor} hover:border-blue-300`
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-gray-700"><Icon className="w-6 h-6" /></span>
        {active && (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">
            ACTIVE
          </span>
        )}
      </div>
      <div className={`font-bold text-base mb-1 ${active ? "text-blue-700" : cfg.textColor}`}>
        {cfg.label}
      </div>
      <div className="text-xs text-gray-500 mb-3 line-clamp-2">{cfg.description}</div>
      <div className={`text-xs font-semibold ${active ? "text-blue-600" : cfg.textColor}`}>
        {count.toLocaleString()}+ questions
      </div>
    </button>
  );
}

// ── Main practice content (needs Suspense for useSearchParams) ────────────────
function PracticeContent() {
  usePageTitle("Practice Zone");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeQType, setActiveQType] = useState<string | null>(
    // DEEP-LINK FIX: /practice?topic=X used to land users on "select a category"
    // with the topic silently preselected and zero questions loaded. When a
    // topic/company arrives without an explicit category, open DSA so results
    // render immediately.
    searchParams.get("category") ?? (searchParams.get("company") || searchParams.get("topic") ? "dsa" : null)
  );
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [company, setCompany] = useState(searchParams.get("company") ?? "");
  const [topic, setTopic] = useState(searchParams.get("topic") ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty | "">(
    (searchParams.get("difficulty") as Difficulty) ?? ""
  );
  const [onlyUnsolved, setOnlyUnsolved] = useState(false);
  // MCQ-VISIBILITY: lets students instantly filter to real interactive quizzes
  const [onlyInteractive, setOnlyInteractive] = useState(false);
  const isMcqCategory = activeQType === "aptitude_mcq" || activeQType === "core_cs_mcq";
  const [page, setPage] = useState(1);
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion | null>(null);

  // Sync URL when category changes
  useEffect(() => {
    if (activeQType) {
      const params = new URLSearchParams();
      params.set("category", activeQType);
      if (search) params.set("search", search);
      if (company) params.set("company", company);
      if (topic) params.set("topic", topic);
      if (difficulty) params.set("difficulty", difficulty);
      router.replace(`/practice?${params.toString()}`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQType]);

  // Categories — dynamic from /api/practice/categories
  const { data: categoriesData, isLoading: loadingCategories, error: errorCategories, mutate: retryCategories } = usePracticeCategories();
  const categories: { questionType: string; count: number }[] =
    Array.isArray(categoriesData) ? categoriesData : [];

  const activeCfg: CategoryConfig | null = activeQType
    ? (CATEGORY_CONFIG[activeQType] ?? {
        label: activeQType, description: "", iconName: "HelpCircle",
        color: "", borderColor: "", textColor: "",
      })
    : null;

  // Questions — only fetch when a category is selected
  const { data: practiceData, isLoading: loadingQuestions, error: errorQuestions, mutate: retryQuestions } = usePractice({
    topic,
    difficulty,
    company,
    questionType: activeQType ?? undefined,
    isMcq: onlyInteractive ? true : undefined,
    page,
    enabled: activeQType !== null,
  });

  const { completedSet, mutate: mutateCompleted } = useCompletedQuestions();
  const { mutate: mutateMyStats } = usePracticeMyStats();

  const { data: companiesData } = useCompanies();
  const allCompanySlugs = Array.isArray(companiesData) ? companiesData : [];
  const { data: topicsData } = useTopics();
  const allTopics = Array.isArray(topicsData) ? topicsData : [];

  const rawQuestions: any[] = practiceData?.data ?? [];
  const meta = practiceData?.meta ?? null;

  const allQuestions: QuizQuestion[] = rawQuestions.map((q: any) => ({
    ...q,
    id:          q._id ?? q.id,
    title:       q.title       ?? q.problemSummary ?? "",
    diff:        q.diff        ?? q.difficulty     ?? "",
    topic:       Array.isArray(q.topics) ? q.topics[0] : (q.topicTag ?? ""),
    companies:   q.companySlug ? [q.companySlug] : [],
    hot:         q.hot         ?? q.isHot          ?? false,
    leetcodeUrl: q.leetcodeUrl ?? null,
  }));

  const filteredQuestions = useMemo(() => {
    let qs = allQuestions;
    if (onlyUnsolved && completedSet.size >= 0) {
      qs = qs.filter(q => !completedSet.has(String(q.id)));
    }
    if (!search.trim()) return qs;
    const lower = search.toLowerCase();
    return qs.filter(q => q.title?.toLowerCase().includes(lower));
  }, [allQuestions, search, onlyUnsolved, completedSet]);

  const solvedOnPage = filteredQuestions.filter(q => completedSet.has(String(q.id))).length;

  const handleSelectCategory = (qt: string) => {
    setActiveQType(prev => prev === qt ? null : qt);
    setSearch(""); setCompany(""); setTopic(""); setDifficulty("");
    setPage(1); setActiveQuiz(null);
  };

  const openQuiz = (q: QuizQuestion) => {
    setActiveQuiz({ ...q, id: String(q.id) });
  };

  const closeQuiz = () => {
    setActiveQuiz(null);
    // refresh solved-state + stats so the list reflects new completions
    mutateCompleted();
    mutateMyStats();
  };

  return (
    <div>
      {/* Header + solved counter */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PageHeader title="Practice Zone" subtitle="Pick a category, then click any question to open it in a focused quiz view." />
        </div>
      </div>

      {/* Category Grid — dynamic from API */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {errorCategories ? (
          <div className="col-span-full">
            <ErrorState error={errorCategories} title="Couldn't load practice categories" onRetry={() => retryCategories()} />
          </div>
        ) : loadingCategories && categories.length === 0 ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : (
          categories.map((cat) => (
            <CategoryCard
              key={cat.questionType}
              questionType={cat.questionType}
              count={cat.count}
              active={activeQType === cat.questionType}
              onClick={() => handleSelectCategory(cat.questionType)}
            />
          ))
        )}
      </div>

      {/* Question list panel — shown when a category is selected */}
      {activeCfg && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
            <button
              onClick={() => { setActiveQType(null); setActiveQuiz(null); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close category"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-700">
              {(() => { const Icon = IconMap[activeCfg.iconName] ?? HelpCircle; return <Icon className="w-5 h-5" />; })()}
            </span>
            <div>
              <div className="font-bold text-gray-900 text-sm">{activeCfg.label} Questions</div>
              <div className="text-xs text-gray-500">
                {meta
                  ? `${filteredQuestions.length} on page ${meta.page} of ${meta.totalPages} · ${meta.total.toLocaleString()} total`
                  : `${filteredQuestions.length} results`}
                {completedSet.size > 0 && ` · ${solvedOnPage} solved on this page`}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Company */}
            <select
              value={company}
              onChange={(e) => { setCompany(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
            >
              <option value="">All Companies</option>
              {allCompanySlugs.map((c: any) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>

            {/* Topic */}
            <select
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
            >
              <option value="">All Topics</option>
              {allTopics.map((t: string) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Difficulty toggles */}
            <div className="flex gap-1">
              {(["", "Easy", "Medium", "Hard"] as const).map((d) => (
                <button
                  key={d || "all"}
                  onClick={() => { setDifficulty(d as Difficulty | ""); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    difficulty === d
                      ? d === "Easy"   ? "bg-green-600 text-white" :
                        d === "Medium" ? "bg-blue-600 text-white"  :
                        d === "Hard"   ? "bg-red-500 text-white"   : "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {d || "All"}
                </button>
              ))}
            </div>

            {/* Interactive MCQ toggle — prominent on quiz categories */}
            {isMcqCategory && (
              <button
                onClick={() => { setOnlyInteractive(prev => !prev); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  onlyInteractive ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                }`}
                title="Show only questions you can answer interactively (with options + explanation)"
              >
                <Circle className="w-3 h-3" /> Interactive MCQs only
              </button>
            )}

            {/* Unsolved-only toggle */}
            <button
              onClick={() => { setOnlyUnsolved(prev => !prev); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                onlyUnsolved ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Unsolved only
            </button>
          </div>

          {/* Question rows — click opens the quiz modal */}
          {errorQuestions ? (
            <ErrorState error={errorQuestions} title="Couldn't load questions" onRetry={() => retryQuestions()} />
          ) : loadingQuestions && filteredQuestions.length === 0 ? (
            <div className="divide-y divide-gray-50">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-gray-50 rounded animate-pulse mt-2" />
                </div>
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <div className="flex justify-center mb-3 text-gray-300">
                <SearchX className="w-12 h-12" />
              </div>
              <div className="font-medium">{onlyUnsolved ? "You've solved everything matching these filters!" : "No questions found"}</div>
              <div className="text-sm mt-1">Try adjusting your filters</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredQuestions.map((q, idx) => {
                const solved = completedSet.has(String(q.id));
                return (
                  <button
                    key={q.id}
                    onClick={() => router.push(`/practice/${q.id}`)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50/40 transition-colors cursor-pointer text-left group"
                  >
                    <span className="text-xs text-gray-400 font-mono w-6 shrink-0">
                      {(page - 1) * 20 + idx + 1}
                    </span>

                    {solved ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 fill-emerald-50" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-gray-200 shrink-0 group-hover:text-blue-300 transition-colors" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${solved ? "text-gray-400" : "text-gray-900"}`}>{q.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {q.topic && <span className="text-xs text-gray-500">{q.topic}</span>}
                        {q.companies?.slice(0, 2).map((co: string) => (
                          <span key={co} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 capitalize">
                            {co}
                          </span>
                        ))}
                        {q.hot && (
                          <span className="text-xs bg-red-50 text-red-600 rounded px-1.5 py-0.5">
                            <Flame className="w-3 h-3 mr-1 inline-block" /> Hot
                          </span>
                        )}
                        {q.isMcq && (
                          <span className="text-xs bg-violet-50 text-violet-600 rounded px-1.5 py-0.5">MCQ</span>
                        )}
                      </div>
                    </div>

                    <span className={`text-xs font-semibold rounded-full px-2.5 py-1 shrink-0 ${diffBadge(q.diff)}`}>
                      {q.diff}
                    </span>

                    {(() => {
                      const practiceUrl = getPracticeUrl(q);
                      return practiceUrl ? (
                        <a
                          href={practiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors shrink-0 group/link"
                          title={`Solve on ${getPlatformInfo(practiceUrl).name}`}
                          aria-label={`Open ${q.title} on ${getPlatformInfo(practiceUrl).name}`}
                        >
                          <span>Solve</span>
                          <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                        </a>
                      ) : null;
                    })()}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">
                Page {meta.page} of {meta.totalPages} · {meta.total.toLocaleString()} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50:bg-slate-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-sm font-bold text-gray-700 min-w-[4rem] text-center">
                  {meta.page} / {meta.totalPages}
                </span>
                <button
                  onClick={() => {
                    if (meta) setPage(p => Math.min(meta.totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={page >= meta.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50:bg-slate-800/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No category selected hint */}
      {!activeQType && (
        <div className="text-center py-12 text-gray-400">
          <div className="flex justify-center mb-3 text-gray-300">
            <MousePointerClick className="w-12 h-12" />
          </div>
          <div className="font-medium text-gray-600">Select a category above to start practising</div>
          <div className="text-sm mt-1">
            MCQs open with an interactive quiz — coding questions link out and can be marked complete
          </div>
        </div>
      )}

      {/* Quiz modal popup */}
      {activeQuiz && (
        <QuizModal
          question={activeQuiz}
          alreadySolved={completedSet.has(activeQuiz.id)}
          onClose={closeQuiz}
        />
      )}
    </div>
  );
}

// Suspense wrapper required for useSearchParams in App Router
function PracticePageInner() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded-lg w-48 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}

// Admin feature-toggle gate (Feature Controls → student.practice)
export default function PracticePageGate() {
  return (
    <FeatureGate feature="student.practice" title="Practice Zone">
      <PracticePageInner />
    </FeatureGate>
  );
}
