"use client";
import { CompanyLogo } from "@/components/ui";
import { FeatureGate } from "@/lib/features";
import { useState, use, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  BarChart2, Target, Layers, TrendingUp, ChevronRight,
  ExternalLink, Flame, Play, CheckCircle,
  ChevronDown, ChevronUp, Loader2,
} from "lucide-react";

import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
  Legend, CartesianGrid,
} from "recharts";
import { useCompany } from "@/lib/hooks";
import { TARGET_ROLES } from "placeprep-backend/src/constants/roles";
import ErrorState from "@/components/ErrorState";

interface RoundGroup {
  round: string;
  name: string;
  description: string;
  type: string;
  questions: any[];
}

const TABS = ["Overview", "Questions", "Experiences", "Trends"] as const;
type Tab = typeof TABS[number];

// ─── Round-wise question accordion ───────────────────────────────
function RoundAccordion({ group }: { group: RoundGroup }) {
  const [open, setOpen] = useState(true);

  const typeColors: Record<string, string> = {
    "Coding":        "bg-blue-100 text-blue-700",
    "System Design": "bg-indigo-100 text-indigo-700",
    "LLD":           "bg-indigo-100 text-indigo-700",
    "HR":            "bg-green-100 text-green-700",
    "Aptitude":      "bg-slate-100 text-slate-700",
    "Domain":        "bg-gray-100 text-gray-700",
  };

  const diffBadge = (d: string) =>
    d === "Easy"   ? "bg-green-50 text-green-700" :
    d === "Medium" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600";

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      {/* Accordion header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gray-50 hover:bg-gray-100:bg-slate-800 transition-colors text-left"
        aria-expanded={open}
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
            typeColors[group.type] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {group.round}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm">{group.name}</div>
          <div className="text-xs text-gray-500">{group.description}</div>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{group.questions.length} questions</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Questions list */}
      {open && (
        <div className="divide-y divide-gray-50">
          {group.questions.map((q) => (
            <QuestionRow key={q._id} q={q} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionRow({ q }: { q: any }) {
  const diffBadge = (d: string) =>
    d === "Easy"   ? "bg-green-50 text-green-700" :
    d === "Medium" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600";

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50:bg-slate-800/60 transition-colors group">
      {/* Title */}
      <span className="flex-1 text-sm font-medium text-gray-900 truncate">{q.title}</span>

      {/* Topic chip */}
      <span className="hidden sm:inline text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded shrink-0">
        {q.topic}
      </span>

      {/* Difficulty */}
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${diffBadge(q.diff)}`}>
        {q.diff}
      </span>

      {/* Frequency */}
      {q.frequency !== undefined && (
        <span className="hidden md:inline text-xs text-gray-400 shrink-0 w-12 text-right">
          {q.frequency}%
        </span>
      )}

      {/* Hot */}
      {q.hot && <Flame className="w-4 h-4 text-orange-500 shrink-0" />}

      {/* External link */}
      {q.leetcodeUrl ? (
        <a
          href={q.leetcodeUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${q.title} on LeetCode`}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <ExternalLink className="w-4 h-4 text-blue-500 hover:text-blue-700" />
        </a>
      ) : (
        <ExternalLink className="w-4 h-4 text-gray-200 shrink-0" />
      )}
    </div>
  );
}

function CompanyPageInner({ params }: { params: Promise<{ name: string }> }) {
  const { name: slug } = use(params);
  
  const { data: companyRes, isLoading, error, mutate } = useCompany(slug);
  // BUG-C8 FIX: fetcher already unwraps .data — companyRes IS the company object directly
  // The old `companyRes?.data ?? companyRes` worked by accident via the 2nd fallback
  const company = companyRes;

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  // BUG-C9: standardized role values to match targetRoles on Question model
  const [role, setRole] = useState("SDE-1");

  // Intel filters — drill down by interview round AND question type
  const [roundFilter, setRoundFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [trendResult, setTrendResult] = useState<{ data: any[]; hasData: boolean } | null>(null);
  // Fetch once when Trends tab first becomes active; cached in state so
  // switching tabs back and forth does not repeat the request.
  useEffect(() => {
    if (activeTab !== "Trends" || trendResult !== null) return;
    let cancelled = false;
    fetch(`/api/companies/${slug}/trends`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          const payload = d.data ?? {};
          setTrendResult({ data: payload.data ?? [], hasData: payload.hasData ?? false });
        }
      })
      .catch(() => { if (!cancelled) setTrendResult({ data: [], hasData: false }); })
    return () => { cancelled = true; };
  }, [activeTab, slug, trendResult]);

  const displayName = company?.name || (slug.charAt(0).toUpperCase() + slug.slice(1));
  const initial = displayName.charAt(0);

  const roleFilteredQuestions = useMemo(() => {
    if (!company?.questions) return [];
    // Phase 3: filter by targetRoles[] if populated; fall back to show all when empty
    return company.questions.filter((q: any) =>
      q.targetRoles?.length > 0 ? q.targetRoles.includes(role) : true
    );
  }, [company?.questions, role]);

  const availableRounds = useMemo(
    () =>
      Array.from(new Set<string>(roleFilteredQuestions.map((q: any) => q.roundType || "Coding"))).sort(),
    [roleFilteredQuestions]
  );
  const availableTypes = useMemo(
    () =>
      Array.from(new Set<string>(roleFilteredQuestions.map((q: any) => q.questionType || "dsa"))).sort(),
    [roleFilteredQuestions]
  );

  const roundQuestions: RoundGroup[] = useMemo(() => {
    let filtered = roleFilteredQuestions;
    if (roundFilter) filtered = filtered.filter((q: any) => (q.roundType || "Coding") === roundFilter);
    if (typeFilter) filtered = filtered.filter((q: any) => (q.questionType || "dsa") === typeFilter);

    const grouped = filtered.reduce((acc: any, q: any) => {
      const rt = q.roundType || 'Coding';
      if (!acc[rt]) acc[rt] = [];
      acc[rt].push(q);
      return acc;
    }, {});
    return Object.entries(grouped).map(([type, qs]) => ({
      type,
      round: "R",
      name: `${type} Round`,
      description: `Questions typical for ${type} rounds.`,
      questions: qs as any[]
    }));
  }, [roleFilteredQuestions, roundFilter, typeFilter]);

  const totalQuestionCount = roleFilteredQuestions.length;

  // A failed request used to fall through to "Company not found", which told
  // the user the company doesn't exist when the request had actually errored.
  if (error) return <ErrorState error={error} title="Couldn't load company details" onRetry={() => mutate()} />;
  if (isLoading) {
    return (
      <div className="max-w-6xl space-y-5">
        <div className="h-4 w-48 rounded shimmer bg-gray-200/70 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-40 rounded-2xl bg-white border border-gray-200/80 p-6 space-y-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gray-200/70 animate-pulse" />
              <div className="space-y-2 flex-1"><div className="h-5 w-40 bg-gray-200/70 rounded animate-pulse" /><div className="h-3 w-56 bg-gray-100 rounded animate-pulse" /></div>
            </div>
            <div className="flex gap-2"><div className="h-9 w-36 bg-gray-100 rounded-xl animate-pulse" /><div className="h-9 w-32 bg-gray-50 rounded-xl animate-pulse" /></div>
          </div>
          <div className="h-40 rounded-2xl bg-white border border-gray-200/80 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white border border-gray-200/80 animate-pulse" />)}
        </div>
      </div>
    );
  }
  if (!company) return <div className="p-8 text-center text-red-500">Company not found</div>;

  const totalCircumference = 2 * Math.PI * 35;
  const easyPct = company.difficultyDistribution?.Easy || 0;
  const mediumPct = company.difficultyDistribution?.Medium || 0;
  const hardPct = company.difficultyDistribution?.Hard || 0;
  const totalDistribution = easyPct + mediumPct + hardPct || 1;
  
  const easyVal = (easyPct / totalDistribution) * totalCircumference;
  const mediumVal = (mediumPct / totalDistribution) * totalCircumference;
  const hardVal = (hardPct / totalDistribution) * totalCircumference;
  
  const majorityLabel = Math.max(easyPct, mediumPct, hardPct) === easyPct ? "Easy" : Math.max(easyPct, mediumPct, hardPct) === mediumPct ? "Medium" : "Hard";

  const intel = {
    hiringStatus: company.hiringStatus || "Active Hiring",
    avgProcess: company.avgProcessWeeks ? `${company.avgProcessWeeks} Weeks` : "3-4 Weeks",
    hiringNote: company.hiringNote || "No specific hiring note available.",
    successRate: company.successRate || "N/A",
    avgSalary: company.avgSalaryLpa ? `₹${company.avgSalaryLpa} LPA` : "N/A",
    difficulty: (() => {
      // BUG-C5 FIX: Compute from difficultyDistribution instead of hardcoding 7.5
      const dd = company.difficultyDistribution;
      if (dd) {
        const easy   = dd.Easy   || 0;
        const medium = dd.Medium || 0;
        const hard   = dd.Hard   || 0;
        const total  = easy + medium + hard;
        if (total > 0) {
          // Weighted score: Easy=1, Medium=5, Hard=10 → max 10
          const score = (easy * 1 + medium * 5 + hard * 10) / total;
          return score.toFixed(1);
        }
      }
      return "N/A";
    })(),
    totalQuestions: totalQuestionCount,
    roundStructure: company.roundStructure?.map((r: any) => ({
      n: r.roundNumber,
      name: r.roundName,
      dur: `${r.typicalDurationMin || 45} mins • ${r.roundType}`
    })) || [],
    topTopics: company.topicFrequency?.map((t: any) => ({
      topic: t.topicName,
      pct: t.frequencyPct
    })) || [],
    difficultyBreakdown: company.difficultyDistribution ? [
      { name: "Easy",   value: company.difficultyDistribution.Easy   || 0, color: "#10B981" },
      { name: "Medium", value: company.difficultyDistribution.Medium || 0, color: "#F59E0B" },
      { name: "Hard",   value: company.difficultyDistribution.Hard   || 0, color: "#EF4444" },
    ] : [],
    // Interview DNA — three-tier priority chain:
    //   Tier 1: roundStructure entries have derived percentage (qualifying companies ≥10q/≥2 rounds)
    //   Tier 2: roundStructure exists but below threshold — equal weight per round type present
    //   Tier 3: no roundStructure data — proportional defaults, no caveat shown
    interviewDNA: (() => {
      // Tier 1: derived from verified question distribution (13 qualifying companies today)
      const withPct = (company.roundStructure ?? []).filter((r: any) => r.percentage != null);
      if (withPct.length >= 2) {
        const byType: Record<string, number> = {};
        withPct.forEach((r: any) => { byType[r.roundType] = (byType[r.roundType] ?? 0) + r.percentage; });
        return {
          segments: [
            { label: 'DSA',          color: 'bg-blue-600',  pct: byType['Coding'] ?? 0 },
            { label: 'Sys Design',   color: 'bg-amber-400', pct: byType['System Design'] ?? 0 },
            { label: 'Behavioral',   color: 'bg-green-500', pct: (byType['HR'] ?? 0) + (byType['Managerial'] ?? 0) },
            { label: 'Domain/Other', color: 'bg-gray-300',  pct: (byType['Domain'] ?? 0) + (byType['Aptitude'] ?? 0) },
          ].filter(s => s.pct > 0),
          estimated: true,
        };
      }
      // Tier 2: round types present but no derived percentages — equal weight per type
      if (company.roundStructure && company.roundStructure.length > 0) {
        const counts: Record<string, number> = {};
        company.roundStructure.forEach((r: any) => {
          const t = r.roundType || 'Coding';
          counts[t] = (counts[t] || 0) + 1;
        });
        const total = company.roundStructure.length;
        return {
          segments: [
            { label: 'DSA',          color: 'bg-blue-600',  pct: Math.round(((counts.Coding || 0) / total) * 100) },
            { label: 'Sys Design',   color: 'bg-amber-400', pct: Math.round(((counts['System Design'] || 0) / total) * 100) },
            { label: 'Behavioral',   color: 'bg-green-500', pct: Math.round(((counts.HR || counts.Behavioral || 0) / total) * 100) },
            { label: 'Domain/Other', color: 'bg-gray-300',  pct: Math.round(((counts.Domain || counts.Aptitude || 0) / total) * 100) },
          ].filter(s => s.pct > 0),
          estimated: true,
        };
      }
      // Tier 3: HONESTY FIX — there is genuinely no round data. The old code
      // fabricated a 55/25/15/5 split and marked it as verified. Now we report
      // zero segments so the card renders its honest empty state.
      return {
        segments: [],
        estimated: false,
      };
    })(),
    sampleQuestions: company.questions?.slice(0, 3) || [],
  };

  return (
    <div className="max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-5" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-gray-700">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/companies" className="hover:text-gray-700">Companies</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">{displayName}</span>
      </nav>

      {/* Hero + Hiring Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
<CompanyLogo name={slug} size={32} />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              <p className="text-sm text-gray-500 mt-1">Software Engineering Intelligence</p>
            </div>
            <div className="text-right">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select role level"
              >
                {TARGET_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {/* BUG-C6 FIX: was hardcoded 'Jun 2025' — now uses real company.lastSyncedAt or createdAt */}
              <p className="text-xs text-gray-400 mt-2">
                Updated: {company?.lastSyncedAt || company?.createdAt
                  ? new Date(company.lastSyncedAt || company.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                  : 'Jun 2025'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <Link
              href={`/companies/${slug}/practice`}
              className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Play className="w-4 h-4" /> Practice Questions
            </Link>
            <Link
              href={`/roadmap?company=${slug}`}
              className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50:bg-slate-800/60 transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> View Roadmap
            </Link>
          </div>
        </div>

        {/* Hiring Pulse */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Hiring Pulse</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                Current Trend
              </div>
              <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-0.5 rounded">
                {intel.hiringStatus}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Process</span>
              <span className="text-sm font-medium text-gray-900">{intel.avgProcess}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 leading-relaxed border-t border-gray-100 pt-3">
            {intel.hiringNote}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: BarChart2, color: "text-blue-600",   val: intel.successRate,    sub: "SUCCESS RATE",     note: "↑ 2.1%" },
          { icon: Target,   color: "text-amber-500",  val: intel.avgSalary,      sub: "AVG. SALARY (L3)", note: "CTC" },
          { icon: Layers,   color: "text-purple-600", val: intel.difficulty,     sub: "DIFFICULTY",       note: "/10" },
          { icon: TrendingUp, color: "text-green-600", val: intel.totalQuestions, sub: "TOTAL QUESTIONS", note: "tagged" },
        ].map(({ icon: Icon, color, val, sub, note }) => (
          <div key={sub} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{sub}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {val} <span className="text-sm font-medium text-green-600">{note}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {tab === "Questions" && totalQuestionCount > 0 && (
                <span className="ml-1 text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                  {totalQuestionCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview Tab ─────────────────────────────────────────── */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-3 gap-4">
          {/* Round structure */}
          <div className="col-span-3 bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Standard Round Structure</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {intel.roundStructure.map((r: any) => (
                <div key={r.n} className="border border-gray-200 rounded-xl p-4 text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-3 ${
                      r.n === intel.roundStructure.length
                        ? "bg-slate-100 text-slate-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {r.n}
                  </div>
                  <div className="text-sm font-medium text-gray-900">{r.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{r.dur}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interview DNA */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Interview DNA</h3>
            {intel.interviewDNA.segments.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                No verified round-structure data for this company yet.
              </p>
            ) : (
              <>
            <div className="h-6 rounded-full overflow-hidden flex mb-3">
              {intel.interviewDNA.segments.map((segment) => (
                <div
                  key={segment.label}
                  className={`${segment.color} flex items-center justify-center text-white text-xs font-medium`}
                  style={{ width: `${segment.pct}%` }}
                >
                  {segment.pct >= 12 ? `${segment.pct}%` : ''}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {intel.interviewDNA.segments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${segment.color}`} />
                  <span className="text-gray-600">{segment.label} ({segment.pct}%)</span>
                </div>
              ))}
            </div>
            {intel.interviewDNA.estimated && (
              <p className="mt-3 text-xs text-gray-400">
                Estimated from question frequency in this dataset — not verified interview-round data.
              </p>
            )}
              </>
            )}
          </div>

          {/* Top Topics */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Top Topics</h3>
            <div className="space-y-2.5">
              {intel.topTopics.map((t: any) => (
                <div key={t.topic}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700">{t.topic}</span>
                    <span className="text-gray-500">{t.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(t.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Donut — BUG-C3 FIX: computed from intel.difficultyBreakdown (real DB data) */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Question Difficulty</h3>
            {(() => {
              const breakdown = intel.difficultyBreakdown;
              const circumference = 2 * Math.PI * 35; // r=35
              // Sort: Easy, Medium, Hard
              const order = ['Easy', 'Medium', 'Hard'];
              const sorted = order.map(name => breakdown.find((d: any) => d.name === name) || { name, value: 0, color: '#E5E7EB' });
              const total = sorted.reduce((s, d) => s + d.value, 0);
              let offset = 0;
              const segments = sorted.map(d => {
                const dash = total > 0 ? (d.value / total) * circumference : 0;
                const gap  = circumference - dash;
                const seg  = { ...d, dash, gap, offset };
                offset += dash;
                return seg;
              });
              // Find majority label
              const majority = total > 0 ? sorted.reduce((a, b) => a.value >= b.value ? a : b).name : 'N/A';
              return (
                <div className="flex items-center justify-center">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
                      {segments.map(seg => seg.dash > 0 && (
                        <circle
                          key={seg.name}
                          cx="50" cy="50" r="35"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="18"
                          strokeDasharray={`${seg.dash.toFixed(2)} ${seg.gap.toFixed(2)}`}
                          strokeDashoffset={`-${seg.offset.toFixed(2)}`}
                        />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-bold text-gray-900">{majority}</span>
                      <span className="text-xs text-gray-400">MAJORITY</span>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-center gap-4 mt-3 text-xs">
              {intel.difficultyBreakdown.map((d: any) => (
                <div key={d.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-gray-600">{d.name} ({d.value}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Questions */}
          <div className="col-span-3 bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Sample Questions</h3>
              <button
                onClick={() => setActiveTab("Questions")}
                className="text-xs text-blue-600 hover:underline"
              >
                See all with round grouping →
              </button>
            </div>
            <div className="space-y-0">
              {intel.sampleQuestions.map((q: any) => (
                <QuestionRow key={q._id || q.id} q={q} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Questions Tab (Round-wise) ────────────────────────────── */}
      {activeTab === "Questions" && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {displayName} — Round-wise Questions
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {roundQuestions.reduce((s, g) => s + g.questions.length, 0)} of {totalQuestionCount} questions shown • filtered by round &amp; type
              </p>
            </div>
            <Link
              href={`/companies/${slug}/practice`}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Practice All
            </Link>
          </div>

          {/* Round + question-type filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0">Filters</span>

            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              aria-label="Filter by interview round"
            >
              <option value="">All Rounds</option>
              {availableRounds.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              aria-label="Filter by question type"
            >
              <option value="">All Question Types</option>
              {availableTypes.map((t) => {
                const label = String(t).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                return <option key={String(t)} value={String(t)}>{label}</option>;
              })}
            </select>

            {(roundFilter || typeFilter) && (
              <button
                onClick={() => { setRoundFilter(""); setTypeFilter(""); }}
                className="text-xs font-medium text-red-600 hover:text-red-700 ml-auto"
              >
                Clear filters ✕
              </button>
            )}
          </div>

          {roleFilteredQuestions.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No questions tagged yet for {displayName}. Check back soon.
            </div>
          ) : roundQuestions.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No questions match these filters — try clearing them.
            </div>
          ) : (
            roundQuestions.map((group) => (
              <RoundAccordion key={group.type} group={group} />
            ))
          )}
        </div>
      )}

      {/* ── Trends Tab ───────────────────────────────────────────── */}
      {activeTab === "Trends" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Round-type Trends by Year</h3>
          {trendResult === null ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading trend data…
            </div>
          ) : trendResult.hasData ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendResult.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="DSA"          stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="SystemDesign" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Behavioral"   stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">No trend data yet for {displayName}</p>
              <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
                Trend data will appear here once questions are tagged with an interview year.
                Questions can be tagged via the Admin portal.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Experiences Tab ──────────────────────────────────────── */}
      {activeTab === "Experiences" && (
        <div className="space-y-4">
          {(!company.experiences || company.experiences.length === 0) ? (
            <div className="text-center py-8 text-gray-400 text-sm">No experiences available yet.</div>
          ) : company.experiences.map((exp: any, i: number) => (
            <div key={exp._id || i} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
<CompanyLogo name={slug} size={32} />
                <div>
                  <span className="font-medium text-gray-900 text-sm">{displayName}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {exp.roleTitle || "Software Engineer"} • {new Date(exp.createdAt).toLocaleDateString()}
                  </span>
                  {!exp.isVerified && (
                    <span className="ml-2 text-[10px] font-semibold text-amber-600 bg-amber-50 rounded px-1.5 py-0.5 border border-amber-200">
                      Pending Verification
                    </span>
                  )}
                </div>
                <span className="ml-auto text-xs font-medium text-green-700 bg-green-50 rounded px-2 py-0.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Offer {exp.offerStatus}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
                {exp.roundDetails?.map((r: any, idx: number) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 rounded px-2 py-1">
                    Round {r.roundNumber || idx + 1}: {r.roundType}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">
                &quot;{exp.content}&quot;
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Submitted by {exp.isAnonymous ? "Anonymous" : exp.authorName || "Anonymous"}
              </p>
            </div>
          ))}

          {/* Submit CTA */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Interviewed at {displayName}? Share your experience — it helps fellow NST students.
            </p>
            <Link
              href="/submit"
              className="inline-block bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Submit My Experience
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin feature-toggle gate (Feature Controls → student.companies)
export default function CompanyPageGate(props: { params: Promise<{ name: string }> }) {
  return (
    <FeatureGate feature="student.companies" title="Company Intel">
      <CompanyPageInner {...props} />
    </FeatureGate>
  );
}
