"use client";

/**
 * Add a question that isn't tied to any company — a LeetCode problem or
 * similar. Saved as a real Question document with no company, joining the
 * generic pool, so it earns XP and tracks completion like any other.
 */

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createExternalQuestion, type PoolQuestion } from "@/lib/staff/customRoadmaps";

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const XP = { Easy: 10, Medium: 25, Hard: 50 } as const;

export default function ExternalQuestionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (q: PoolQuestion) => void;
}) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("Medium");
  const [url, setUrl] = useState("");
  const [topics, setTopics] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createExternalQuestion({
        problemSummary: title.trim(),
        difficulty,
        topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
        leetcodeUrl: url.trim(),
        source: url.includes("leetcode.com") ? "leetcode" : "external",
      });
      // Handed back in the pool's shape so the caller can drop it straight
      // into the selection list without a refetch.
      onCreated({
        id: created.id,
        title: created.title,
        difficulty,
        topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
        questionType: "dsa",
        isMcq: false,
        roundType: "Coding",
        companySlug: null,
        companyName: null,
        practiceUrl: url.trim() || null,
        frequency: null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the question.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Add external question</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Question title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              placeholder="Merge k Sorted Lists"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Practice link</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              type="url"
              placeholder="https://leetcode.com/problems/…"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Difficulty</span>
            <div className="mt-1.5 flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    difficulty === d
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {d}
                  <span className="ml-1 text-[10px] text-gray-400">+{XP[d]}</span>
                </button>
              ))}
            </div>
            {/* Matches how XP is derived everywhere else, so an external
                question is worth the same as an equivalent company one. */}
            <p className="mt-1 text-[11px] text-gray-400">XP is set from difficulty automatically.</p>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Topics <span className="normal-case text-gray-400">(comma separated)</span>
            </span>
            <input
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Heap, Linked List"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add question
          </button>
        </div>
      </form>
    </div>
  );
}
