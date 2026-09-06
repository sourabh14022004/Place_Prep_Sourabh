"use client";

/**
 * Custom roadmap builder — shared by the faculty and admin portals.
 *
 * Follows the authoring flow: pick companies, review their questions and take
 * all or some, optionally add external ones, then arrange everything into
 * named weeks.
 *
 * Weeks are arranged by hand rather than auto-split, so the ordering controls
 * are explicit buttons rather than drag-and-drop: they work with a keyboard
 * and on touch, and need no extra dependency.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowDown, ArrowUp, Building2, Check, ChevronDown, Globe,
  Loader2, Plus, Save, Search, Send, Trash2, Users, X,
} from "lucide-react";
import {
  createRoadmap, getCompanies, getCompanyQuestions, getRoadmap, publishRoadmap,
  updateRoadmap, type PoolQuestion, type RoadmapStatus, type StaffCompany,
} from "@/lib/staff/customRoadmaps";
import ExternalQuestionModal from "./ExternalQuestionModal";
import UnpublishDialog from "./UnpublishDialog";

interface WeekDraft {
  weekNumber: number;
  label: string;
  questionIds: string[];
}

const DIFF_STYLE: Record<string, string> = {
  Easy: "bg-green-50 text-green-700",
  Medium: "bg-amber-50 text-amber-700",
  Hard: "bg-red-50 text-red-600",
};

export default function RoadmapBuilder({
  basePath,
  roadmapId,
}: {
  /** "/faculty" or "/admin" — the portal this is mounted under. */
  basePath: string;
  /** Absent when creating. */
  roadmapId?: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<RoadmapStatus>("draft");
  const [followerCount, setFollowerCount] = useState(0);

  const [companies, setCompanies] = useState<StaffCompany[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false);

  const [pool, setPool] = useState<PoolQuestion[]>([]);
  const [poolTotals, setPoolTotals] = useState<Record<string, number>>({});
  const [poolLoading, setPoolLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");

  /**
   * Every question we've seen, by id. Weeks can hold questions that are not in
   * the current pool — saved earlier under a company since deselected, or an
   * external one — so week rendering resolves from here, never from `pool`.
   */
  const [known, setKnown] = useState<Record<string, PoolQuestion>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [weeks, setWeeks] = useState<WeekDraft[]>([
    { weekNumber: 1, label: "Week 1", questionIds: [] },
  ]);

  const [loading, setLoading] = useState(Boolean(roadmapId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showExternal, setShowExternal] = useState(false);
  const [showUnpublish, setShowUnpublish] = useState(false);

  const remember = useCallback((qs: PoolQuestion[]) => {
    setKnown((prev) => {
      const next = { ...prev };
      for (const q of qs) next[q.id] = q;
      return next;
    });
  }, []);

  // ── load company list, and the roadmap when editing ──
  useEffect(() => {
    getCompanies().then(setCompanies).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!roadmapId) return;
    getRoadmap(roadmapId)
      .then((r) => {
        setTitle(r.title);
        setDescription(r.description ?? "");
        setStatus(r.status);
        setFollowerCount(r.followerCount);
        setPicked(r.companySlugs);
        setWeeks(
          r.weeks.length
            ? r.weeks.map((w) => ({
                weekNumber: w.weekNumber,
                label: w.label,
                questionIds: w.questions.map((q) => q._id),
              }))
            : [{ weekNumber: 1, label: "Week 1", questionIds: [] }]
        );
        // Seed `known` from the hydrated payload so saved weeks render even
        // before (or without) any pool fetch.
        remember(
          r.weeks.flatMap((w) =>
            w.questions.map((q) => ({
              id: q._id,
              title: q.problemSummary,
              difficulty: q.difficulty,
              topics: q.topics ?? [],
              questionType: q.questionType ?? "dsa",
              isMcq: q.isMcq ?? false,
              roundType: "",
              companySlug: q.companySlug ?? null,
              companyName: q.companyName ?? null,
              practiceUrl: q.leetcodeUrl || q.sourceUrl || null,
              frequency: null,
            }))
          )
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [roadmapId, remember]);

  // ── fetch the question pool whenever the company picks or filters change ──
  useEffect(() => {
    if (picked.length === 0) {
      setPool([]);
      setPoolTotals({});
      return;
    }
    setPoolLoading(true);
    const t = setTimeout(() => {
      getCompanyQuestions({ companies: picked, search: search || undefined, difficulty: difficulty || undefined })
        .then((d) => {
          setPool(d.questions);
          setPoolTotals(d.totalsByCompany);
          remember(d.questions);
        })
        .catch((e) => setError(e.message))
        .finally(() => setPoolLoading(false));
    }, 250); // debounce the search box
    return () => clearTimeout(t);
  }, [picked, search, difficulty, remember]);

  const assignedIds = useMemo(
    () => new Set(weeks.flatMap((w) => w.questionIds)),
    [weeks]
  );

  const visiblePool = pool;
  const unassignedVisible = visiblePool.filter((q) => !assignedIds.has(q.id));
  const totalAssigned = assignedIds.size;

  // ── company picking ──
  function toggleCompany(slug: string) {
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));
  }

  // ── selection ──
  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  const allVisibleSelected =
    unassignedVisible.length > 0 && unassignedVisible.every((q) => selected.has(q.id));
  function toggleSelectAll() {
    setSelected((s) => {
      const next = new Set(s);
      if (allVisibleSelected) unassignedVisible.forEach((q) => next.delete(q.id));
      else unassignedVisible.forEach((q) => next.add(q.id));
      return next;
    });
  }

  // ── weeks ──
  function addWeek() {
    setWeeks((w) => [
      ...w,
      { weekNumber: w.length + 1, label: `Week ${w.length + 1}`, questionIds: [] },
    ]);
  }
  function removeWeek(index: number) {
    setWeeks((w) =>
      w.filter((_, i) => i !== index).map((wk, i) => ({ ...wk, weekNumber: i + 1 }))
    );
  }
  function renameWeek(index: number, label: string) {
    setWeeks((w) => w.map((wk, i) => (i === index ? { ...wk, label } : wk)));
  }
  function addSelectedToWeek(index: number) {
    if (selected.size === 0) return;
    setWeeks((w) =>
      w.map((wk, i) =>
        i === index
          ? { ...wk, questionIds: [...wk.questionIds, ...[...selected].filter((id) => !wk.questionIds.includes(id))] }
          : wk
      )
    );
    setNotice(`Added ${selected.size} question(s) to ${weeks[index].label}.`);
    setSelected(new Set());
  }
  function removeFromWeek(weekIndex: number, id: string) {
    setWeeks((w) =>
      w.map((wk, i) => (i === weekIndex ? { ...wk, questionIds: wk.questionIds.filter((q) => q !== id) } : wk))
    );
  }
  function moveInWeek(weekIndex: number, from: number, to: number) {
    setWeeks((w) =>
      w.map((wk, i) => {
        if (i !== weekIndex) return wk;
        if (to < 0 || to >= wk.questionIds.length) return wk;
        const ids = [...wk.questionIds];
        [ids[from], ids[to]] = [ids[to], ids[from]];
        return { ...wk, questionIds: ids };
      })
    );
  }

  // ── persistence ──
  async function save(): Promise<string | null> {
    setError(null);
    if (!title.trim()) {
      setError("Give the roadmap a title before saving.");
      return null;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        weeks: weeks.map((w) => ({
          weekNumber: w.weekNumber,
          label: w.label.trim() || `Week ${w.weekNumber}`,
          questionIds: w.questionIds,
        })),
      };
      if (roadmapId) {
        await updateRoadmap(roadmapId, payload);
        setNotice(
          status === "published" && followerCount > 0
            ? `Saved. ${followerCount} student(s) following this see the change immediately.`
            : "Saved."
        );
        return roadmapId;
      }
      const created = await createRoadmap(payload);
      setNotice("Draft created.");
      router.replace(`${basePath}/custom-roadmaps/${created.id}`);
      return created.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndPublish() {
    const id = await save();
    if (!id) return;
    setSaving(true);
    try {
      await publishRoadmap(id);
      setStatus("published");
      setNotice("Published — students can now find and follow this roadmap.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading roadmap…
      </div>
    );
  }

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companyQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl">
      {/* ── header ─────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled roadmap"
            className="w-full max-w-xl bg-transparent text-2xl font-black tracking-tight text-gray-900 outline-none placeholder:text-gray-300"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a short description students will see…"
            className="mt-1 w-full max-w-xl bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} followerCount={followerCount} />
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save draft
          </button>
          {status !== "published" ? (
            <button
              onClick={saveAndPublish}
              disabled={saving || totalAssigned === 0}
              title={totalAssigned === 0 ? "Add at least one question first" : undefined}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> Publish
            </button>
          ) : (
            <button
              onClick={() => setShowUnpublish(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Take down
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <Check className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="ml-auto text-blue-400 hover:text-blue-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Editing a live roadmap is not the same as editing a draft. */}
      {status === "published" && followerCount > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>{followerCount}</strong> {followerCount === 1 ? "student is" : "students are"}{" "}
            following this. Changes you save appear for them immediately — questions they have
            already solved stay credited.
          </span>
        </div>
      )}

      {/* ── step 1: companies ──────────────────────────────── */}
      <section className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-900">1 · Companies</h2>
          <span className="text-xs text-gray-400">{picked.length} selected</span>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {picked.map((slug) => {
            const c = companies.find((x) => x.slug === slug);
            return (
              <span key={slug} className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-2.5 pr-1 text-xs font-semibold text-blue-700">
                {c?.name ?? slug}
                <span className="text-blue-400">{poolTotals[slug] ?? c?.questionCount ?? 0}</span>
                <button onClick={() => toggleCompany(slug)} className="rounded-full p-0.5 hover:bg-blue-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {picked.length === 0 && (
            <p className="text-xs text-gray-400">Pick one or more companies to see their questions.</p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setCompanyOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add company
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {companyOpen && (
            <div className="absolute z-20 mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 p-2">
                <input
                  autoFocus
                  value={companyQuery}
                  onChange={(e) => setCompanyQuery(e.target.value)}
                  placeholder="Search companies…"
                  className="w-full rounded-lg bg-gray-50 px-2.5 py-1.5 text-sm outline-none"
                />
              </div>
              <div className="max-h-64 overflow-y-auto p-1">
                {filteredCompanies.slice(0, 60).map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => toggleCompany(c.slug)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-gray-50"
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${picked.includes(c.slug) ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                      {picked.includes(c.slug) && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="flex-1 truncate text-gray-800">{c.name}</span>
                    {/* A company with no questions can be picked but yields nothing. */}
                    <span className={`text-xs ${c.questionCount === 0 ? "text-gray-300" : "text-gray-400"}`}>
                      {c.questionCount}
                    </span>
                  </button>
                ))}
                {filteredCompanies.length === 0 && (
                  <p className="px-2.5 py-3 text-sm text-gray-400">No companies match.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── steps 2-4: pool | weeks ────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* pool */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-4">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">2 · Questions</h2>
              <span className="text-xs text-gray-400">
                {poolLoading ? "loading…" : `${unassignedVisible.length} available`}
              </span>
              <button
                onClick={() => setShowExternal(true)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Globe className="h-3.5 w-3.5" /> Add external
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="">All</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            {unassignedVisible.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {allVisibleSelected ? "Clear selection" : `Select all ${unassignedVisible.length}`}
                </button>
                {selected.size > 0 && (
                  <>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs font-medium text-gray-600">{selected.size} selected</span>
                    <div className="ml-auto flex items-center gap-1">
                      <span className="text-xs text-gray-400">add to</span>
                      <select
                        onChange={(e) => {
                          const i = Number(e.target.value);
                          if (!Number.isNaN(i)) addSelectedToWeek(i);
                          e.target.value = "";
                        }}
                        defaultValue=""
                        className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 outline-none"
                      >
                        <option value="" disabled>week…</option>
                        {weeks.map((w, i) => (
                          <option key={i} value={i}>{w.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="max-h-[32rem] overflow-y-auto p-2">
            {picked.length === 0 && (
              <p className="px-2 py-8 text-center text-sm text-gray-400">
                Pick a company above to load its questions.
              </p>
            )}
            {picked.length > 0 && unassignedVisible.length === 0 && !poolLoading && (
              <p className="px-2 py-8 text-center text-sm text-gray-400">
                {pool.length === 0 ? "No questions match." : "All loaded questions are already in a week."}
              </p>
            )}
            {unassignedVisible.map((q) => (
              <button
                key={q.id}
                onClick={() => toggleSelect(q.id)}
                className={`flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition-colors ${
                  selected.has(q.id) ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected.has(q.id) ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                  {selected.has(q.id) && <Check className="h-3 w-3 text-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-800">{q.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${DIFF_STYLE[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {q.companyName ?? "External"}
                    </span>
                    {q.topics.slice(0, 2).map((t) => (
                      <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{t}</span>
                    ))}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* weeks */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 p-4">
            <h2 className="text-sm font-bold text-gray-900">3 · Weeks</h2>
            <span className="text-xs text-gray-400">{totalAssigned} question(s) arranged</span>
            <button
              onClick={addWeek}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add week
            </button>
          </div>

          <div className="max-h-[32rem] space-y-3 overflow-y-auto p-3">
            {weeks.map((w, wi) => (
              <div key={wi} className="rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-900 text-[10px] font-bold text-white">
                    {w.weekNumber}
                  </span>
                  <input
                    value={w.label}
                    onChange={(e) => renameWeek(wi, e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  />
                  <span className="text-xs text-gray-400">{w.questionIds.length}</span>
                  {weeks.length > 1 && (
                    <button onClick={() => removeWeek(wi)} className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="p-1.5">
                  {w.questionIds.length === 0 && (
                    <p className="px-2 py-3 text-center text-xs text-gray-400">
                      Select questions on the left, then choose this week.
                    </p>
                  )}
                  {w.questionIds.map((id, qi) => {
                    const q = known[id];
                    return (
                      <div key={id} className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                        <span className="w-4 shrink-0 text-[11px] tabular-nums text-gray-300">{qi + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-gray-800">
                            {q?.title ?? "(question unavailable)"}
                          </span>
                          {q && (
                            <span className="flex items-center gap-1.5">
                              <span className={`rounded px-1 py-0.5 text-[10px] font-semibold ${DIFF_STYLE[q.difficulty]}`}>
                                {q.difficulty}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {q.companyName ?? "External"}
                              </span>
                            </span>
                          )}
                        </span>
                        <span className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => moveInWeek(wi, qi, qi - 1)} disabled={qi === 0}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 disabled:opacity-30">
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button onClick={() => moveInWeek(wi, qi, qi + 1)} disabled={qi === w.questionIds.length - 1}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 disabled:opacity-30">
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button onClick={() => removeFromWeek(wi, id)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showExternal && (
        <ExternalQuestionModal
          onClose={() => setShowExternal(false)}
          onCreated={(q) => {
            // Drop straight into the pool and pre-select it, so the next click
            // is "add to week" rather than hunting for it in the list.
            remember([q]);
            setPool((p) => [q, ...p]);
            setSelected((s) => new Set(s).add(q.id));
            setShowExternal(false);
            setNotice(`"${q.title}" added — now select a week for it.`);
          }}
        />
      )}

      {showUnpublish && roadmapId && (
        <UnpublishDialog
          roadmapId={roadmapId}
          onClose={() => setShowUnpublish(false)}
          onDone={(mode) => {
            setShowUnpublish(false);
            if (mode === "remove") router.push(`${basePath}/custom-roadmaps`);
            else {
              setStatus("retired");
              setNotice("Hidden from new students. Existing followers keep it.");
            }
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status, followerCount }: { status: RoadmapStatus; followerCount: number }) {
  const map: Record<RoadmapStatus, string> = {
    draft: "bg-gray-100 text-gray-600",
    published: "bg-green-50 text-green-700",
    retired: "bg-amber-50 text-amber-700",
  };
  const label: Record<RoadmapStatus, string> = {
    draft: "Draft",
    published: "Published",
    retired: "Hidden from new students",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}>
      {label[status]}
      {followerCount > 0 && (
        <span className="inline-flex items-center gap-0.5 opacity-70">
          <Users className="h-3 w-3" />
          {followerCount}
        </span>
      )}
    </span>
  );
}
