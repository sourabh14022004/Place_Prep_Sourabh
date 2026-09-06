"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import {
  RefreshCw, ShieldAlert, Search, Info, Power, PowerOff,
  GraduationCap, Users, Zap,
} from "lucide-react";

interface FeatureFlagDoc {
  key: string;
  portal: "student" | "faculty";
  label: string;
  description?: string;
  group: string;
  enabled: boolean;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `API ${res.status}`);
  return json.data;
};

const PORTAL_META = {
  student: {
    title: "Student Portal Features",
    icon: GraduationCap,
    accent: "text-blue-600 bg-blue-50 border-blue-200",
    masterKey: null as string | null,
  },
  faculty: {
    title: "Faculty Portal Features",
    icon: Users,
    accent: "text-indigo-600 bg-indigo-50 border-indigo-200",
    masterKey: "faculty.portal",
  },
} as const;

export default function FeatureControlsPage() {
  const { data, error, isLoading, mutate } = useSWR<{ features: FeatureFlagDoc[] }>(
    "/api/admin/features",
    fetcher,
    { revalidateOnFocus: true }
  );
  const features = data?.features ?? null;
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const pushUpdates = async (updates: { key: string; enabled: boolean }[], labels: string[]) => {
    // Optimistic
    mutate(
      (current) =>
        current
          ? {
              features: current.features.map((f) => {
                const u = updates.find((x) => x.key === f.key);
                return u ? { ...f, enabled: u.enabled } : f;
              }),
            }
          : current,
      { revalidate: false }
    );
    setSavingKeys((prev) => new Set([...prev, ...updates.map((u) => u.key)]));
    try {
      const res = await fetch("/api/admin/features", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `API ${res.status}`);
      toast.success(labels.join(" · "));
    } catch (e) {
      await mutate(); // authoritative rollback
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        updates.forEach((u) => next.delete(u.key));
        return next;
      });
    }
  };

  const updateFlag = (flag: FeatureFlagDoc, enabled: boolean) =>
    pushUpdates([{ key: flag.key, enabled }], [
      `${flag.label} ${enabled ? "enabled" : "disabled"} — applies across portals within ~30s`,
    ]);

  /** One-click KILL SWITCH for an entire portal side. */
  const toggleEntirePortal = (portal: "student" | "faculty" | "faculty-connect", enable: boolean) => {
    if (!features) return;
    let keys: FeatureFlagDoc[];
    let label: string;
    if (portal === "faculty") {
      keys = features.filter((f) => f.portal === "faculty");
      label = enable ? "Faculty Portal fully ENABLED" : "Faculty Portal fully DISABLED — hidden from faculty AND students";
    } else if (portal === "faculty-connect") {
      keys = features.filter(
        (f) => f.key === "student.faculty_connect" || f.key === "student.doubts" || f.key === "student.sessions" || f.key === "student.messages"
      );
      label = enable
        ? "All faculty-related features restored for students"
        : "ALL faculty-related items hidden from every student (Doubts, Sessions, Messages)";
    } else {
      keys = features.filter((f) => f.portal === "student");
      label = enable ? "All student features ENABLED" : "All student features DISABLED";
    }
    void pushUpdates(keys.map((f) => ({ key: f.key, enabled: enable })), [label]);
  };

  const grouped = useMemo(() => {
    if (!features) {
      return { student: [] as [string, FeatureFlagDoc[]][], faculty: [] as [string, FeatureFlagDoc[]][] };
    }
    const q = search.trim().toLowerCase();
    const filtered = q
      ? features.filter(
          (f) =>
            f.label.toLowerCase().includes(q) ||
            f.key.toLowerCase().includes(q) ||
            f.group.toLowerCase().includes(q)
        )
      : features;
    const build = (portal: "student" | "faculty"): [string, FeatureFlagDoc[]][] => {
      const byGroup = new Map<string, FeatureFlagDoc[]>();
      for (const f of filtered) {
        if (f.portal !== portal) continue;
        const arr = byGroup.get(f.group) ?? [];
        arr.push(f);
        byGroup.set(f.group, arr);
      }
      return Array.from(byGroup.entries());
    };
    return { student: build("student"), faculty: build("faculty") };
  }, [features, search]);

  const byKey = useMemo(() => new Map((features ?? []).map((f) => [f.key, f])), [features]);
  const facultyMaster = byKey.get("faculty.portal");
  const connectMaster = byKey.get("student.faculty_connect");
  const busy = savingKeys.size > 0;

  if (error) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Feature Controls</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
          {error instanceof Error ? error.message : "Failed to load feature flags"}
          <button onClick={() => mutate()} className="ml-3 underline font-medium">Retry</button>
        </div>
      </div>
    );
  }

  if (!features || isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading feature controls…</div>
    );
  }

  const Toggle = ({ on, onClick, disabled, large }: { on: boolean; onClick: () => void; disabled?: boolean; large?: boolean }) => (
    <button
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${
        large ? "w-14 h-8" : "w-11 h-6"
      } ${on ? "bg-emerald-500" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform ${
          large ? "w-7 h-7" : "w-5 h-5"
        } ${on ? (large ? "translate-x-6" : "translate-x-5") : ""}`}
      />
    </button>
  );

  return (
    <div className="max-w-5xl pb-10">
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Feature Controls</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kill switches &amp; feature toggles for both portals. Disabled features vanish from navigation,
            pages become inaccessible and their APIs refuse requests — live, within ~30 seconds.
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* ══════════ KILL SWITCHES ══════════ */}
      <section className="mt-5 mb-8">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Emergency Kill Switches</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Faculty Portal master */}
          <div className={`rounded-2xl border-2 p-5 transition-colors ${
            facultyMaster?.enabled === false
              ? "border-red-300 bg-red-50"
              : "border-emerald-200 bg-emerald-50/40"
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  facultyMaster?.enabled === false ? "bg-red-100" : "bg-emerald-100"
                }`}>
                  {facultyMaster?.enabled === false
                    ? <PowerOff className="w-5 h-5 text-red-600" />
                    : <Power className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm">Faculty Portal</h3>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    ONE CLICK: removes the <strong>entire Faculty Portal</strong> from faculty members{" "}
                    <em>and</em> pairs below to hide Doubts / Sessions / Messages from students.
                  </p>
                  <p className={`text-xs font-bold mt-1.5 ${
                    facultyMaster?.enabled === false ? "text-red-600" : "text-emerald-700"
                  }`}>
                    {facultyMaster?.enabled === false ? "● OFFLINE — hidden everywhere" : "● ONLINE"}
                  </p>
                </div>
              </div>
              <Toggle
                large
                on={facultyMaster?.enabled !== false}
                disabled={busy}
                onClick={() => {
                  const enable = facultyMaster?.enabled === false;
                  const updates = [{ key: "faculty.portal", enabled: enable }];
                  // Pair: also flip the student-side faculty connect so nothing leaks.
                  if (connectMaster && connectMaster.enabled !== enable) {
                    updates.push({ key: "student.faculty_connect", enabled: enable });
                  }
                  pushUpdates(updates, [enable ? "Faculty Portal is LIVE again" : "FACULTY PORTAL DISABLED — invisible to everyone"]);
                }}
              />
            </div>
          </div>

          {/* Student Faculty Connect master */}
          <div className={`rounded-2xl border-2 p-5 transition-colors ${
            connectMaster?.enabled === false
              ? "border-red-300 bg-red-50"
              : "border-emerald-200 bg-emerald-50/40"
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  connectMaster?.enabled === false ? "bg-red-100" : "bg-emerald-100"
                }`}>
                  {connectMaster?.enabled === false
                    ? <PowerOff className="w-5 h-5 text-red-600" />
                    : <Zap className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm">Student ↔ Faculty Connect</h3>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    ONE CLICK: strips <strong>every faculty trace from the Student Portal</strong> — Ask a Doubt,
                    Book a Session, Messages — gone from sidebar and pages.
                  </p>
                  <p className={`text-xs font-bold mt-1.5 ${
                    connectMaster?.enabled === false ? "text-red-600" : "text-emerald-700"
                  }`}>
                    {connectMaster?.enabled === false ? "● HIDDEN FROM STUDENTS" : "● VISIBLE TO STUDENTS"}
                  </p>
                </div>
              </div>
              <Toggle
                large
                on={connectMaster?.enabled !== false}
                disabled={busy}
                onClick={() => toggleEntirePortal("faculty-connect", connectMaster?.enabled === false)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mt-4 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Use these when something breaks in production: flip a switch OFF, fix the issue, flip it back ON.
            Students never see a broken page — they see nothing at all. Individual features remain controllable below.
          </span>
        </div>
      </section>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search features…"
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* ══════════ PER-PORTAL SECTIONS ══════════ */}
      {(["student", "faculty"] as const).map((portal) => {
        const meta = PORTAL_META[portal];
        const groups = grouped[portal];
        const Icon = meta.icon;
        const portalFlags = features.filter((f) => f.portal === portal);
        const totalOn = portalFlags.filter((f) => f.enabled).length;
        const allOn = totalOn === portalFlags.length;
        return (
          <section key={portal} className="mb-10">
            <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 mb-4 ${meta.accent}`}>
              <Icon className="w-5 h-5" />
              <div className="flex-1">
                <h2 className="font-semibold text-sm">{meta.title}</h2>
              </div>
              <span className="text-xs font-bold tabular-nums mr-2">{totalOn}/{portalFlags.length} ON</span>
              {!search && portalFlags.length > 0 && (
                <>
                  <button
                    disabled={allOn || busy}
                    onClick={() => toggleEntirePortal(portal, true)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Enable all
                  </button>
                  <button
                    disabled={!allOn || busy}
                    onClick={() => toggleEntirePortal(portal, false)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Disable all
                  </button>
                </>
              )}
            </div>

            {groups.length === 0 ? (
              <p className="text-sm text-gray-400 px-1">No features match your search.</p>
            ) : (
              groups.map(([group, flags]) => (
                <div key={group} className="mb-5">
                  <p className="px-1 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {group}
                  </p>
                  <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {flags.map((flag) => {
                      const isMaster =
                        flag.key === "faculty.portal" || flag.key === "student.faculty_connect";
                      return (
                        <div
                          key={flag.key}
                          className={`flex items-start gap-4 px-4 py-3.5 ${
                            !flag.enabled ? "bg-gray-50/70" : ""
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-900">{flag.label}</span>
                              {isMaster && (
                                <span className="text-[9px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                                  Master
                                </span>
                              )}
                              {savingKeys.has(flag.key) && (
                                <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{flag.description}</p>
                          </div>
                          <Toggle
                            on={flag.enabled}
                            disabled={savingKeys.has(flag.key) || busy}
                            onClick={() => updateFlag(flag, !flag.enabled)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </section>
        );
      })}

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Student features live",
            value: `${features.filter((f) => f.portal === "student" && f.enabled).length}/${features.filter((f) => f.portal === "student").length}`,
          },
          {
            label: "Faculty features live",
            value: `${features.filter((f) => f.portal === "faculty" && f.enabled).length}/${features.filter((f) => f.portal === "faculty").length}`,
          },
          {
            label: "Faculty portal state",
            value: facultyMaster?.enabled ? "Online" : "Offline",
          },
          {
            label: "Student faculty-connect",
            value: connectMaster?.enabled ? "Visible" : "Hidden",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div className="text-lg font-bold text-gray-900">{s.value}</div>
            <div className="text-[11px] text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 text-[11px] text-gray-400 mt-4">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Changes propagate to all users within ~30 seconds — no redeploy needed.
      </div>
    </div>
  );
}
