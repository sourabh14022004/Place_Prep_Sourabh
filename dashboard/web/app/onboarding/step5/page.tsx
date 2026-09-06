"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Stepper from "@/components/onboarding/Stepper";
import { savePlatformHandle } from "@/lib/hooks";

const PLATFORMS = [
  {
    id: "leetcode" as const,
    name: "LeetCode",
    color: "#FFA116",
    bg: "bg-orange-50",
    border: "border-orange-200",
    ring: "focus:ring-orange-400",
    btn: "bg-orange-500 hover:bg-orange-600",
    profileUrl: (u: string) => `https://leetcode.com/u/${u}`,
    placeholder: "e.g. john_doe or leetcode.com/u/john_doe",
    why: "Required to verify LeetCode problem completions automatically.",
  },
  {
    id: "codeforces" as const,
    name: "Codeforces",
    color: "#1F8ACB",
    bg: "bg-blue-50",
    border: "border-blue-200",
    ring: "focus:ring-blue-400",
    btn: "bg-blue-600 hover:bg-blue-700",
    profileUrl: (u: string) => `https://codeforces.com/profile/${u}`,
    placeholder: "e.g. tourist or codeforces.com/profile/tourist",
    why: "Required to verify Codeforces problem completions automatically.",
  },
] as const;

type PlatformId = typeof PLATFORMS[number]["id"];

export default function Step5() {
  const router = useRouter();
  const [handles, setHandles] = useState<Partial<Record<PlatformId, string>>>({});
  const [saved, setSaved] = useState<Partial<Record<PlatformId, boolean>>>({});
  const [saving, setSaving] = useState<PlatformId | null>(null);

  const cleanHandle = (raw: string): string => {
    let s = raw.trim().replace(/\/+$/, "");
    if (s.includes("/")) s = s.split("/").pop()!;
    return s.replace(/^@/, "");
  };

  const handleSave = async (id: PlatformId) => {
    const raw = handles[id] ?? "";
    const handle = cleanHandle(raw);
    if (!handle) { toast.error("Enter a username or profile URL first."); return; }
    setSaving(id);
    try {
      await savePlatformHandle(id, handle);
      setSaved(prev => ({ ...prev, [id]: true }));
      toast.success(`${PLATFORMS.find(p => p.id === id)!.name} linked!`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save. Try again.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left brand panel */}
      <div className="hidden md:flex w-[320px] shrink-0 bg-gradient-to-br from-blue-700 to-indigo-800 flex-col justify-between px-10 py-12">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-white/20 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
            <span className="font-bold text-white text-sm">PlacePrep</span>
          </div>
          <h2 className="text-white text-3xl font-extrabold leading-tight mb-3">
            Connect<br />your profiles
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Link LeetCode and Codeforces so PlacePrep can automatically verify your problem completions. No more manual marking.
          </p>
        </div>
        <div className="text-blue-200 text-xs">NST Placement Prep Portal · Student Edition</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 md:px-8 py-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg">
          <Stepper currentStep={5} totalSteps={5} />

          <div className="mt-8 mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Coding Platform Profiles</h1>
            <p className="text-sm text-gray-500">
              When you mark a coding problem as done, we&apos;ll check your submission automatically. You can also update these anytime from your Profile.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {PLATFORMS.map((pl) => (
              <div key={pl.id} className={`rounded-2xl border ${pl.border} ${pl.bg} p-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                    style={{ background: pl.color }}
                  >
                    {pl.id === "leetcode" ? "LC" : "CF"}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{pl.name}</div>
                    <div className="text-[11px] text-gray-500">{pl.why}</div>
                  </div>
                  {saved[pl.id] && (
                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto shrink-0" />
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={handles[pl.id] ?? ""}
                    onChange={e => setHandles(prev => ({ ...prev, [pl.id]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleSave(pl.id)}
                    placeholder={pl.placeholder}
                    className={`flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${pl.ring} bg-white`}
                  />
                  <button
                    onClick={() => handleSave(pl.id)}
                    disabled={saving === pl.id || !handles[pl.id]?.trim()}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${pl.btn} disabled:opacity-50 flex items-center gap-1.5 shrink-0`}
                  >
                    {saving === pl.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved[pl.id] ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : null}
                    {saved[pl.id] ? "Linked" : "Link"}
                  </button>
                </div>

                {saved[pl.id] && handles[pl.id] && (
                  <a
                    href={pl.profileUrl(cleanHandle(handles[pl.id]!))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View your {pl.name} profile
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              Continue to Dashboard →
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600"
            >
              Skip for now — I&apos;ll add these later from my Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
