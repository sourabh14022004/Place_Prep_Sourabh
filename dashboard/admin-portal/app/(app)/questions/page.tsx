"use client";

import { useState, useEffect, Fragment } from "react";
import {
  Search, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Check, Trash2, AlertCircle, Database,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminQuestions,
  useAdminQuestion,
  patchQuestion,
  deleteQuestion,
  bulkApproveQuestions,
  bulkApproveByFilter,
} from "@/lib/hooks";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:   "bg-green-50 text-green-700",
  Medium: "bg-yellow-50 text-yellow-700",
  Hard:   "bg-red-50 text-red-700",
};

const TYPE_LABELS: Record<string, string> = {
  dsa:             "DSA",
  aptitude_mcq:    "Aptitude MCQ",
  core_cs_mcq:     "CS MCQ",
  system_design:   "System Design",
  lld:             "LLD",
  hr_behavioral:   "HR",
  domain_specific: "Domain",
};

const LIMIT = 20;

function QuestionDetailPanel({ id }: { id: string }) {
  const { data, isLoading } = useAdminQuestion(id);
  const q: any = data?.question ?? data;

  if (isLoading) {
    return (
      <div className="px-6 py-4 flex gap-4 animate-pulse">
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-200 rounded" />
      </div>
    );
  }
  if (!q) return null;

  const isMcq = q.questionType === "aptitude_mcq" || q.questionType === "core_cs_mcq";

  const isEmpty =
    !isMcq &&
    !q.explanation &&
    !q.sampleAnswer &&
    !q.hints?.length &&
    !q.followUpQuestions?.length &&
    !q.keyPoints?.length;

  return (
    <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 space-y-4">
      {q.cautionSource && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
          ⚠ Caution source — GPL v3
        </span>
      )}

      {isMcq && q.options?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Options</p>
          <div className="space-y-1">
            {q.options.map((opt: any, i: number) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-sm px-3 py-1.5 rounded-lg ${
                  opt.isCorrect ? "bg-green-50 text-green-800 font-medium" : "text-gray-700"
                }`}
              >
                <span className="font-bold w-5 shrink-0">
                  {opt.label ?? String.fromCharCode(65 + i)}.
                </span>
                <span className="flex-1">{opt.text}</span>
                {opt.isCorrect && <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {q.explanation && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Explanation</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.explanation}</p>
        </div>
      )}

      {q.sampleAnswer && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Sample Answer</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.sampleAnswer}</p>
        </div>
      )}

      {q.keyPoints?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Key Points</p>
          <ul className="space-y-1">
            {q.keyPoints.map((kp: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-400 mt-0.5">•</span> {kp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {q.hints?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hints</p>
          <ol className="space-y-1">
            {q.hints.map((h: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-gray-400 font-medium shrink-0">{i + 1}.</span> {h}
              </li>
            ))}
          </ol>
        </div>
      )}

      {q.followUpQuestions?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Follow-up Questions</p>
          <ul className="space-y-1">
            {q.followUpQuestions.map((fq: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-gray-400 shrink-0">→</span> {fq}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isEmpty && (
        <p className="text-sm text-gray-400 italic">No additional detail stored for this question.</p>
      )}

      {q.sourceUrl && (
        <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
          Source:{" "}
          <a
            href={q.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600 break-all"
          >
            {q.sourceUrl}
          </a>
        </p>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  const [page, setPage]                   = useState(1);
  const [companyInput, setCompanyInput]   = useState("");
  const [company, setCompany]             = useState("");
  const [difficulty, setDifficulty]       = useState("");
  const [questionType, setQuestionType]   = useState("");
  const [verified, setVerified]           = useState("");
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [expandedId, setExpandedId]       = useState<string | null>(null);

  useEffect(() => {
    const h = setTimeout(() => { setCompany(companyInput); setPage(1); }, 500);
    return () => clearTimeout(h);
  }, [companyInput]);

  const { data, isLoading, mutate } = useAdminQuestions(page, LIMIT, {
    company, difficulty, questionType, verified,
  });
  const questions: any[] = data?.questions ?? [];
  const total: number    = data?.total ?? 0;
  const totalPages       = Math.ceil(total / LIMIT);

  const toggleSelect = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allChecked = questions.length > 0 && selected.size === questions.length;
  const selectAll  = () =>
    setSelected(allChecked ? new Set() : new Set(questions.map((q: any) => q._id)));

  const toggleExpand = (id: string) =>
    setExpandedId(prev => (prev === id ? null : id));

  const resetSelection = () => {
    setSelected(new Set());
    setSelectAllMode(false);
  };

  const handleVerify = async (id: string, value: boolean) => {
    try {
      await patchQuestion(id, { verified: value });
      await mutate();
      toast.success(value ? "Question verified" : "Marked unverified");
    } catch {
      toast.error("Failed to update question");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    try {
      await deleteQuestion(id);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      await mutate();
      toast.success("Question deleted");
    } catch {
      toast.error("Failed to delete question");
    }
  };

  const handleBulkVerify = async () => {
    if (selectAllMode) {
      if (!confirm(`Verify all ${total} questions matching current filters? This cannot be undone.`)) return;
      try {
        const result = await bulkApproveByFilter(
          { company, difficulty, questionType, verified },
          true
        );
        resetSelection();
        await mutate();
        const count = result?.data?.modifiedCount ?? result?.modifiedCount ?? total;
        toast.success(`${count} questions verified`);
      } catch {
        toast.error("Bulk verify failed");
      }
      return;
    }
    const ids = Array.from(selected);
    try {
      await bulkApproveQuestions(ids, true);
      setSelected(new Set());
      await mutate();
      toast.success(`${ids.length} questions verified`);
    } catch {
      toast.error("Bulk verify failed");
    }
  };

  const hasFilters = company || difficulty || questionType || verified;
  const clearFilters = () => {
    setCompanyInput(""); setCompany(""); setDifficulty("");
    setQuestionType(""); setVerified(""); setPage(1);
    resetSelection();
  };

  const paginationPages = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const half  = 3;
    let start   = Math.max(1, page - half);
    const end   = Math.min(totalPages, start + 6);
    if (end - start < 6) start = Math.max(1, end - 6);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  const showSelectAllBanner = allChecked && total > questions.length && !selectAllMode;
  const hasSelection = selected.size > 0 || selectAllMode;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} questions total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            className="pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-40 placeholder:text-gray-400"
            placeholder="Company slug…"
            value={companyInput}
            onChange={e => setCompanyInput(e.target.value)}
          />
        </div>
        <select
          value={questionType}
          onChange={e => { setQuestionType(e.target.value); setPage(1); setSelectAllMode(false); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 bg-white"
        >
          <option value="">All Types</option>
          <option value="dsa">DSA</option>
          <option value="aptitude_mcq">Aptitude MCQ</option>
          <option value="core_cs_mcq">Core CS MCQ</option>
          <option value="system_design">System Design</option>
          <option value="lld">LLD</option>
          <option value="hr_behavioral">HR Behavioral</option>
          <option value="domain_specific">Domain Specific</option>
        </select>
        <select
          value={difficulty}
          onChange={e => { setDifficulty(e.target.value); setPage(1); setSelectAllMode(false); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 bg-white"
        >
          <option value="">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select
          value={verified}
          onChange={e => { setVerified(e.target.value); setPage(1); setSelectAllMode(false); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 bg-white"
        >
          <option value="">All Status</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {hasSelection && (
          <button
            onClick={handleBulkVerify}
            className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            {selectAllMode ? `Verify all ${total}` : `Verify ${selected.size} selected`}
          </button>
        )}
      </div>

      {/* Select-all banner */}
      {showSelectAllBanner && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-blue-700 flex items-center gap-2">
          All {questions.length} questions on this page are selected.
          <button
            onClick={() => setSelectAllMode(true)}
            className="font-semibold underline underline-offset-2 hover:text-blue-900"
          >
            Select all {total} matching current filters
          </button>
        </div>
      )}
      {selectAllMode && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-blue-700 flex items-center gap-2">
          All {total} questions matching current filters are selected.
          <button
            onClick={resetSelection}
            className="font-semibold underline underline-offset-2 hover:text-blue-900"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
          <span className="text-sm font-semibold text-gray-500">{total} questions found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={selectAll}
                    className="rounded border-gray-300 accent-blue-600"
                  />
                </th>
                {["Question", "Company", "Type", "Difficulty", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-4 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-64 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-100 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-14 bg-gray-100 rounded-full" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-100 rounded-full" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : questions.length > 0 ? (
                questions.flatMap((q: any) => {
                  const isExpanded = expandedId === q._id;
                  return [
                    <tr
                      key={q._id}
                      className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(q._id)}
                          onChange={() => toggleSelect(q._id)}
                          className="rounded border-gray-300 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.problemSummary}</p>
                        {q.isHot && (
                          <span className="text-[10px] font-bold text-orange-500 uppercase">🔥 Hot</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 font-medium">{q.companyName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">
                          {TYPE_LABELS[q.questionType] ?? q.questionType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${DIFFICULTY_COLORS[q.difficulty] ?? "bg-gray-100 text-gray-600"}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {q.verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700">
                            <Check className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700">
                            <AlertCircle className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => handleVerify(q._id, !q.verified)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              {q.verified ? "Unverify" : "Verify"}
                            </button>
                            <button
                              onClick={() => handleDelete(q._id)}
                              className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => toggleExpand(q._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title={isExpanded ? "Collapse" : "View details"}
                          >
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>,
                    ...(isExpanded ? [
                      <tr key={`${q._id}-detail`}>
                        <td colSpan={7} className="p-0 border-b border-gray-100">
                          <QuestionDetailPanel id={q._id} />
                        </td>
                      </tr>
                    ] : []),
                  ];
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <Database className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">No questions found.</p>
                    <p className="text-xs text-gray-300 mt-1">Try clearing your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/40">
            <span className="text-sm text-gray-400 font-medium">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {paginationPages.map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                    page === p ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
