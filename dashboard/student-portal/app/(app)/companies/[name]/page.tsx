"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  BarChart2, Target, Layers, TrendingUp, ChevronRight,
  ExternalLink, Flame, Play, CheckCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";

import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
  Legend, CartesianGrid,
} from "recharts";
import { getCompanyIntel, getCompanyBg, type RoundGroup, type Question } from "@/lib/mock-data";
import { fetchCompanyIntel } from "@/lib/api";
import CompanyLogo from "@/components/ui/CompanyLogo";

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
        className="w-full flex items-center gap-3 px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
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
            <QuestionRow key={q.id} q={q} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionRow({ q }: { q: Question }) {
  const diffBadge = (d: string) =>
    d === "Easy"   ? "bg-green-50 text-green-700" :
    d === "Medium" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-600";

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
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

      {/* XP */}
      <span className="text-xs text-amber-600 font-medium shrink-0">+{q.xp} XP</span>

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

// ─── Main Company Page ────────────────────────────────────────────
export default function CompanyPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: slug } = use(params);
  const [intel, setIntel] = useState<any>(() => getCompanyIntel(slug));
  const bg = getCompanyBg(slug);

  useEffect(() => {
    async function loadBackendIntel() {
      try {
        const data = await fetchCompanyIntel(slug);
        if (data) {
          setIntel((prev: any) => ({
            ...prev,
            ...data,
            roundStructure: data.roundStructure || prev.roundStructure || [],
            topTopics: data.topTopics || prev.topTopics || [],
            hiringStatus: data.hiringStatus || prev.hiringStatus || "Active Hiring",
            avgSalary: data.avgSalary || prev.avgSalary || "₹28 LPA",
            avgProcess: data.avgProcess || prev.avgProcess || "3-4 Weeks",
            difficulty: data.difficulty || prev.difficulty || "8.5/10",
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch live intel from backend:", err);
      }
    }
    loadBackendIntel();
  }, [slug]);

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [role, setRole] = useState("SDE-1 (L3)");

  const displayName = intel.name || (slug.charAt(0).toUpperCase() + slug.slice(1));
  const initial = displayName.charAt(0);

  const totalQuestionCount = (intel.roundQuestions || []).reduce(
    (acc: number, g: any) => acc + (g.questions ? g.questions.length : 0), 0
  );

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
            <CompanyLogo
              logoUrl={intel.logoUrl}
              slug={slug}
              name={displayName}
              className="w-14 h-14 rounded-xl"
            />
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
                <option>SDE-1 (L3)</option>
                <option>SDE-2 (L4)</option>
                <option>Data Analyst</option>
              </select>
              <p className="text-xs text-gray-400 mt-2">Updated: Jun 2025</p>
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
              className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
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
              {(intel.roundStructure || []).map((r: any, idx: number) => {
                const roundNum = r.n || r.roundNumber || (idx + 1);
                const roundName = r.name || r.roundName || `Round ${roundNum}`;
                const roundDur = r.dur || (r.typicalDurationMin ? `${r.typicalDurationMin} mins` : (r.description || "45 mins"));
                return (
                  <div key={r.n || r.roundNumber || r.roundName || idx} className="border border-gray-200 rounded-xl p-4 text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mx-auto mb-3 ${
                        roundNum === (intel.roundStructure || []).length
                          ? "bg-slate-100 text-slate-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {roundNum}
                    </div>
                    <div className="text-sm font-medium text-gray-900">{roundName}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">{roundDur}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interview DNA */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Interview DNA</h3>
            <div className="h-6 rounded-full overflow-hidden flex mb-3">
              <div className="bg-blue-600 flex items-center justify-center text-white text-xs" style={{ width: "55%" }}>55%</div>
              <div className="bg-amber-400 flex items-center justify-center text-white text-xs" style={{ width: "25%" }}>25%</div>
              <div className="bg-green-500 flex items-center justify-center text-white text-xs" style={{ width: "15%" }}>15%</div>
              <div className="bg-gray-300 flex items-center justify-center text-gray-600 text-xs" style={{ width: "5%" }}>5%</div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { c: "bg-blue-600", l: "DSA (55%)" },
                { c: "bg-amber-400", l: "Sys Design (25%)" },
                { c: "bg-green-500", l: "Behavioral (15%)" },
                { c: "bg-gray-300", l: "Domain (5%)" },
              ].map(({ c, l }) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                  <span className="text-gray-600">{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Topics */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Top Topics</h3>
            <div className="space-y-2.5">
              {(intel.topTopics || []).map((t: any, idx: number) => {
                const topicName = t.topic || t.topicName || `Topic ${idx + 1}`;
                const pct = t.pct !== undefined ? t.pct : (t.frequencyPct || 50);
                return (
                  <div key={t.topic || t.topicName || idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700">{topicName}</span>
                      <span className="text-gray-500">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty Donut */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Question Difficulty</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#10B981" strokeWidth="18" strokeDasharray="11 283" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#F59E0B" strokeWidth="18" strokeDasharray="71 283" strokeDashoffset="-11" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#EF4444" strokeWidth="18" strokeDasharray="155 283" strokeDashoffset="-82" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold text-gray-900">Hard</span>
                  <span className="text-xs text-gray-400">MAJORITY</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-3 text-xs">
              {(intel.difficultyBreakdown || []).map((d: any, idx: number) => (
                <div key={d.name || idx} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color || "#3B82F6" }} />
                  <span className="text-gray-600">{d.name || "Level"} ({d.value || 0}%)</span>
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
              {(intel.sampleQuestions || []).map((q: any, idx: number) => (
                <QuestionRow key={q._id || q.id || q.title || idx} q={q} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Questions Tab (Round-wise) ────────────────────────────── */}
      {activeTab === "Questions" && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {displayName} — Round-wise Questions
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {totalQuestionCount} questions tagged for {displayName} • sorted by round order
              </p>
            </div>
            <Link
              href={`/companies/${slug}/practice`}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Practice All
            </Link>
          </div>

          {intel.roundQuestions.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No questions tagged yet for {displayName}. Check back soon.
            </div>
          ) : (
            intel.roundQuestions.map((group) => (
              <RoundAccordion key={group.type} group={group} />
            ))
          )}
        </div>
      )}

      {/* ── Trends Tab ───────────────────────────────────────────── */}
      {activeTab === "Trends" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Topic Trends (2022–2025)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={intel.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="DSA"          stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="SystemDesign" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="Behavioral"   stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Experiences Tab ──────────────────────────────────────── */}
      {activeTab === "Experiences" && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?sz=64&domain=${slug}.com`}
                  alt={displayName}
                  className="w-8 h-8 rounded-lg shrink-0 object-contain bg-white border border-gray-100 p-1"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?sz=64&domain=example.com"; }}
                />
                <div>
                  <span className="font-medium text-gray-900 text-sm">{displayName}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    SDE-1 • {i === 1 ? "Jan 2026" : i === 2 ? "Dec 2025" : "Nov 2025"}
                  </span>
                </div>
                <span className="ml-auto text-xs font-medium text-green-700 bg-green-50 rounded px-2 py-0.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Offer Received
                </span>
              </div>
              <div className="flex gap-2 mb-3 text-xs text-gray-500">
                <span className="bg-blue-50 text-blue-700 rounded px-2 py-1">Round 1: Arrays, DP</span>
                <span className="bg-purple-50 text-purple-700 rounded px-2 py-1">Round 2: System Design</span>
                <span className="bg-green-50 text-green-700 rounded px-2 py-1">Round 3: HR</span>
              </div>
              <p className="text-sm text-gray-600">
                &quot;Arrays and DP were heavily tested in coding rounds. System design was LLD focused.
                Be ready with STAR stories for behavioral questions.&quot;
              </p>
              <p className="text-xs text-gray-400 mt-2">Submitted anonymously · {i * 3} days ago</p>
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
