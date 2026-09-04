"use client";
import Link from "next/link";
import { Link2, ExternalLink } from "lucide-react";
import { usePlatformProfiles } from "@/lib/hooks";

// Platforms PlacePrep can sync. A platform only ever renders when the
// user has actually connected a handle for it on their profile.
export const CODING_PLATFORMS = [
  { id: "leetcode", name: "LeetCode", accent: "bg-orange-500" },
  { id: "codeforces", name: "Codeforces", accent: "bg-blue-600" },
] as const;

export type ConnectedPlatform = {
  id: string;
  name: string;
  accent: string;
  handle: string;
  stat: Record<string, any>;
};

export function useConnectedPlatforms() {
  const { data, isLoading, mutate } = usePlatformProfiles();
  const handles: Record<string, string> = data?.handles ?? {};
  const stats: Record<string, any> = data?.stats ?? {};

  const connected: ConnectedPlatform[] = CODING_PLATFORMS
    .filter((pl) => typeof handles[pl.id] === "string" && handles[pl.id].trim() !== "")
    .map((pl) => ({ ...pl, handle: handles[pl.id], stat: stats[pl.id] ?? {} }));

  return { connected, isLoading, mutate };
}

// ── LeetCode Signature Donut Ring ──────────────────────────────────────────
function LeetCodeDonut({
  easy,
  medium,
  hard,
  total,
  size = 82,
}: {
  easy: number;
  medium: number;
  hard: number;
  total: number;
  size?: number;
}) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const sum = Math.max(1, easy + medium + hard);

  const easyDash = (easy / sum) * circ;
  const medDash = (medium / sum) * circ;
  const hardDash = (hard / sum) * circ;

  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
        {easy > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#00B8A3"
            strokeWidth={stroke}
            strokeDasharray={`${easyDash} ${circ - easyDash}`}
            strokeDashoffset={0}
          />
        )}
        {medium > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#FFA116"
            strokeWidth={stroke}
            strokeDasharray={`${medDash} ${circ - medDash}`}
            strokeDashoffset={-easyDash}
          />
        )}
        {hard > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#FF375F"
            strokeWidth={stroke}
            strokeDasharray={`${hardDash} ${circ - hardDash}`}
            strokeDashoffset={-(easyDash + medDash)}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="text-base font-black text-gray-900 leading-none tabular-nums">{total}</span>
        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">Solved</span>
      </div>
    </div>
  );
}

// ── LeetCode Official Platform Card ─────────────────────────────────────────
export function LeetCodeCard({ platform }: { platform: ConnectedPlatform }) {
  const easy = Number(platform.stat.easy) || 0;
  const medium = Number(platform.stat.medium) || 0;
  const hard = Number(platform.stat.hard) || 0;
  const total = Number(platform.stat.totalSolved) || (easy + medium + hard);
  const ranking = platform.stat.ranking ? Number(platform.stat.ranking) : null;
  const sum = Math.max(1, easy + medium + hard);

  const easyPct = Math.round((easy / sum) * 100);
  const medPct = Math.round((medium / sum) * 100);
  const hardPct = Math.round((hard / sum) * 100);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-[#FFA116]/50 hover:shadow-sm">
      {/* Signature LeetCode brand accent hairline */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#FFA116] via-[#FFC01E] to-[#FFA116]" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFF8F0] border border-[#FFE8D6] shadow-2xs overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/leetcode.png"
              alt="LeetCode logo"
              className="w-full h-full object-contain scale-[1.35] transform"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://image.pngaaa.com/118/4868118-middle.png";
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-900">LeetCode</span>
              <a
                href={`https://leetcode.com/u/${platform.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#FFA116] transition-colors"
                title="View profile on LeetCode"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <a
              href={`https://leetcode.com/u/${platform.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-[11px] font-medium text-gray-400 hover:text-gray-600 block"
            >
              @{platform.handle}
            </a>
          </div>
        </div>

        {ranking ? (
          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/60 tabular-nums">
              #{ranking.toLocaleString()}
            </span>
            <div className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Global Rank</div>
          </div>
        ) : null}
      </div>

      {/* LeetCode Solved Problems Visual Breakdown */}
      <div className="flex items-center gap-3.5">
        <LeetCodeDonut easy={easy} medium={medium} hard={hard} total={total} size={82} />

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Easy */}
          <div className="rounded-lg bg-gray-50/70 px-2.5 py-1 border border-gray-100/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#00B8A3] text-[11px]">Easy</span>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-gray-900 tabular-nums text-xs">{easy}</span>
                <span className="text-[10px] text-gray-400 font-medium tabular-nums">({easyPct}%)</span>
              </div>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-gray-200/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#00B8A3] transition-all duration-500"
                style={{ width: `${total > 0 ? Math.max(8, easyPct) : 0}%` }}
              />
            </div>
          </div>

          {/* Medium */}
          <div className="rounded-lg bg-gray-50/70 px-2.5 py-1 border border-gray-100/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#FFA116] text-[11px]">Med.</span>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-gray-900 tabular-nums text-xs">{medium}</span>
                <span className="text-[10px] text-gray-400 font-medium tabular-nums">({medPct}%)</span>
              </div>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-gray-200/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FFA116] transition-all duration-500"
                style={{ width: `${total > 0 ? Math.max(8, medPct) : 0}%` }}
              />
            </div>
          </div>

          {/* Hard */}
          <div className="rounded-lg bg-gray-50/70 px-2.5 py-1 border border-gray-100/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#FF375F] text-[11px]">Hard</span>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-gray-900 tabular-nums text-xs">{hard}</span>
                <span className="text-[10px] text-gray-400 font-medium tabular-nums">({hardPct}%)</span>
              </div>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-gray-200/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF375F] transition-all duration-500"
                style={{ width: `${total > 0 ? Math.max(8, hardPct) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Codeforces Platform Card ────────────────────────────────────────────────
function getCodeforcesRankMeta(r: number) {
  if (r >= 2400) return { title: "Grandmaster", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
  if (r >= 2200) return { title: "Master", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" };
  if (r >= 1900) return { title: "Candidate Master", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" };
  if (r >= 1600) return { title: "Expert", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
  if (r >= 1400) return { title: "Specialist", color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" };
  if (r >= 1200) return { title: "Pupil", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
  return { title: "Newbie", color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200" };
}

export function CodeforcesCard({ platform }: { platform: ConnectedPlatform }) {
  const rating = Number(platform.stat.rating) || 0;
  const maxRating = Number(platform.stat.maxRating) || rating;
  const rankMeta = getCodeforcesRankMeta(rating);
  const rankTitle = platform.stat.rank && platform.stat.rank !== "unrated" ? platform.stat.rank : rankMeta.title;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-blue-300/60 hover:shadow-sm">
      {/* Codeforces 3-color top bar */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] flex">
        <div className="flex-1 bg-[#FFD400]" />
        <div className="flex-1 bg-[#2172C3]" />
        <div className="flex-1 bg-[#C70000]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-[#F0F6FF] border border-[#D6E6FE] p-1.5 shadow-2xs">
            <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
              <rect x="2.5" y="9.5" width="4.5" height="11.5" rx="1.5" fill="#FFD400" />
              <rect x="9.75" y="3.5" width="4.5" height="17.5" rx="1.5" fill="#2172C3" />
              <rect x="17" y="6.5" width="4.5" height="14.5" rx="1.5" fill="#C70000" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-900">Codeforces</span>
              <a
                href={`https://codeforces.com/profile/${platform.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="View profile on Codeforces"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <a
              href={`https://codeforces.com/profile/${platform.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`truncate text-[11px] font-semibold block capitalize ${rankMeta.color}`}
            >
              @{platform.handle}
            </a>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border capitalize ${rankMeta.bg} ${rankMeta.color} ${rankMeta.border}`}>
            {rankTitle}
          </span>
          <div className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Rank</div>
        </div>
      </div>

      {/* Codeforces rating display */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50/70 p-2.5 border border-gray-100/80">
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Current Rating</div>
          <div className={`text-xl font-black tabular-nums leading-tight ${rankMeta.color}`}>
            {rating > 0 ? rating.toLocaleString() : "—"}
          </div>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div className="text-right">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Max Rating</div>
          <div className="text-sm font-bold text-gray-800 tabular-nums">
            {maxRating > 0 ? maxRating.toLocaleString() : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Generic Platform Card Fallback ──────────────────────────────────────────
export function PlatformCard({ platform }: { platform: ConnectedPlatform }) {
  if (platform.id === "leetcode") {
    return <LeetCodeCard platform={platform} />;
  }
  if (platform.id === "codeforces") {
    return <CodeforcesCard platform={platform} />;
  }
  return (
    <div className="rounded-xl border border-gray-100 p-3 bg-white">
      <div className="text-xs font-bold text-gray-900">{platform.name}</div>
      <div className="text-[10px] text-gray-400">@{platform.handle}</div>
    </div>
  );
}

// ── Connected Profile Cards (used in Progress & sidebars) ───────────────────
export function ConnectedProfileCards({ emptyHref = "/profile" }: { emptyHref?: string }) {
  const { connected, isLoading } = useConnectedPlatforms();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-[120px] rounded-xl border border-gray-100 bg-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (connected.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-center">
        <p className="text-xs text-gray-500">No coding profile connected yet.</p>
        <Link href={emptyHref} className="mt-2 inline-block text-xs font-semibold text-orange-600 hover:underline">
          Connect LeetCode or Codeforces →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {connected.map((pl) => (
        <PlatformCard key={pl.id} platform={pl} />
      ))}
    </div>
  );
}

// ── Compact Card for the Dashboard Right Rail ──────────────────────────────
export function CodingProfilesCompact() {
  const { connected, isLoading } = useConnectedPlatforms();

  if (isLoading) {
    return <div className="h-[160px] rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />;
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Coding Profiles</h3>
        <Link href="/profile" className="text-[10px] font-medium text-blue-600 hover:underline">
          {connected.length > 0 ? "Manage →" : "Connect →"}
        </Link>
      </div>

      {connected.length === 0 ? (
        <Link
          href="/profile"
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-4 text-xs font-medium text-gray-400 hover:border-blue-200 hover:text-blue-600 transition-colors"
        >
          <Link2 className="h-3.5 w-3.5" /> Link LeetCode or Codeforces
        </Link>
      ) : (
        <div className="space-y-3">
          {connected.map((pl) => (
            <PlatformCard key={pl.id} platform={pl} />
          ))}
        </div>
      )}
    </div>
  );
}
