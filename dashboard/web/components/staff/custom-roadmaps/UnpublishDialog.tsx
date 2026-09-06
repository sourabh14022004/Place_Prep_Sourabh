"use client";

/**
 * Confirmation for taking a published roadmap down.
 *
 * Two-step on purpose: followers are linked live, so removing a roadmap can
 * strand students mid-prep. The dialog loads the real follower count from the
 * API and states both outcomes in full before either can be chosen — neither
 * button is a default, and the destructive one is styled apart.
 */

import { useEffect, useState } from "react";
import { AlertTriangle, EyeOff, Loader2, Trash2, X } from "lucide-react";
import {
  getUnpublishPreview,
  unpublishRoadmap,
  type UnpublishPreview,
} from "@/lib/staff/customRoadmaps";

export default function UnpublishDialog({
  roadmapId,
  onClose,
  onDone,
}: {
  roadmapId: string;
  onClose: () => void;
  onDone: (mode: "retire" | "remove") => void;
}) {
  const [preview, setPreview] = useState<UnpublishPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"retire" | "remove" | null>(null);

  useEffect(() => {
    getUnpublishPreview(roadmapId).then(setPreview).catch((e) => setError(e.message));
  }, [roadmapId]);

  async function run(mode: "retire" | "remove") {
    setBusy(mode);
    setError(null);
    try {
      await unpublishRoadmap(roadmapId, mode);
      onDone(mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Take this roadmap down</h2>
            {preview && (
              <p className="mt-0.5 text-xs text-gray-500">{preview.title}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          {!preview && !error && (
            <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking who is following…
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {preview && (
            <>
              {preview.followerCount > 0 && (
                <div className="mb-4 flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-900">
                    <strong>{preview.followerCount}</strong>{" "}
                    {preview.followerCount === 1 ? "student is" : "students are"} following this
                    roadmap right now.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => run("retire")}
                  disabled={busy !== null}
                  className="flex w-full gap-3 rounded-xl border border-gray-200 p-3.5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">
                      {preview.options.retire.label}
                      {busy === "retire" && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                      {preview.options.retire.effect}
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => run("remove")}
                  disabled={busy !== null}
                  className="flex w-full gap-3 rounded-xl border border-red-200 p-3.5 text-left transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>
                    <span className="block text-sm font-semibold text-red-700">
                      {preview.options.remove.label}
                      {busy === "remove" && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-red-600/80">
                      {preview.options.remove.effect}
                    </span>
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-3">
          <button
            onClick={onClose}
            disabled={busy !== null}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
