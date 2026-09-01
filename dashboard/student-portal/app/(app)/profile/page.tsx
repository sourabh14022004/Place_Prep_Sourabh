"use client";
import { CompanyLogo, PlatformLogo } from "@/components/ui";
import { useState, useEffect } from "react";
import Link from "next/link";
import { updateProfile, useProfile, useRoadmap, useDashboard, useProgress, usePlatformProfiles, savePlatformHandle } from "@/lib/hooks";
import ErrorState from "@/components/ErrorState";
import PlacePrepCard from "@/components/PlacePrepCard";
import { DifficultyDonut, TopicStrength, StatTile } from "@/components/Stats";
import { usePageTitle } from "@/lib/use-page-title";
import { toast } from "sonner";
import {
 User, Settings, BarChart2, Bell,
 Edit2, Flame, RotateCcw, Trash2, AlertTriangle,
 X, Plus, Check, Save, Link2, Globe, GitBranch,
 Zap, Trophy, Target, Code2, TrendingUp, BookOpen,
 Shield, Eye, ChevronRight, ExternalLink, Loader2, RefreshCw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────
type Tab = "overview" | "career" | "performance" | "settings";

// ── Static reference options (not mock data) ──────────
const COMPANY_CATEGORIES = ["MAANG", "Product", "Service", "Startup", "BFSI", "Other"] as const;
type CompanyCategory = typeof COMPANY_CATEGORIES[number];

const ALL_COMPANIES = [
 "Google", "Amazon", "Microsoft", "Meta", "Apple",
 "Flipkart", "Razorpay", "Swiggy", "Zepto", "Paytm",
 "TCS", "Infosys", "Wipro", "Uber",
];

const DOMAINS = [
 { icon: Code2,   label: "SDE / Software Engineering" },
 { icon: TrendingUp, label: "Frontend / Full Stack" },
 { icon: BarChart2, label: "Data Science / ML" },
 { icon: BookOpen,  label: "Data Analyst" },
 { icon: Settings,  label: "DevOps / Cloud" },
];

const SKILL_TOPICS = [
 { id: "dsa",   label: "Data Structures & Algorithms" },
 { id: "sysdesign",label: "System Design (HLD)" },
 { id: "lld",   label: "Low Level Design" },
 { id: "os",    label: "Operating Systems" },
 { id: "dbms",   label: "DBMS & SQL" },
 { id: "behavioral",label: "Behavioral (STAR)" },
];

const PREP_WEEKS = [4, 6, 8, 12] as const;

const defaultUser = {
 bestStreak: 0,
 name: "Pranay Sarkar",
 initials: "PS",
 email: "pranay.sarkar@nst.edu",
 roll: "2201CS42",
 branch: "CS-AI",
 batch: "2023",
 bio: "Targeting MAANG SDE-1 roles. Passionate about distributed systems and DSA.",
 linkedin: "linkedin.com/in/pranaysarkar",
 github: "github.com/pranaysarkar",
 // Career settings
 categories: ["MAANG", "Product"] as CompanyCategory[],
 targetCompanies: ["Google", "Amazon", "Flipkart"],
 domains: ["SDE / Software Engineering", "Frontend / Full Stack"],
 prepWeeks: 8,
 skillRatings: { dsa: 6, sysdesign: 4, lld: 3, os: 5, dbms: 5, behavioral: 7 } as Record<string, number>,
 // Stats
 xp: 1240,
 rank: 42,
 streak: 14,
 solved: { easy: 52, medium: 67, hard: 9 },
 badges: ["5-Day Streak", "First Solve", "Problem Master", "Speed Coder"],
 companyReadiness: [
  { name: "Google",  pct: 45, logo: "https://www.google.com/favicon.ico" },
  { name: "Amazon",  pct: 70, logo: "https://www.amazon.com/favicon.ico" },
  { name: "Flipkart", pct: 20, logo: "https://www.flipkart.com/favicon.ico" },
 ],
 avatarUrl: null as string | null,
};

// ── Reusable Toggle ───────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
 return (
  <button
   role="switch"
   aria-checked={on}
   onClick={onChange}
   className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent duration-200 focus:outline-none ${
    on ? "bg-blue-600" : "bg-gray-200"
   }`}
  >
   <span
    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
     on ? "translate-x-4" : "translate-x-0"
    }`}
   />
  </button>
 );
}

// ── Coding Profiles Card ──────────────────────────────
const CODING_PLATFORMS = [
  { id: "leetcode"   as const, name: "LeetCode",   color: "#FFA116", profileUrl: (u: string) => `https://leetcode.com/u/${u}`,           placeholder: "Username or leetcode.com/u/…" },
  { id: "codeforces" as const, name: "Codeforces", color: "#1F8ACB", profileUrl: (u: string) => `https://codeforces.com/profile/${u}`,   placeholder: "Username or codeforces.com/profile/…" },
] as const;
type CodingPlatformId = typeof CODING_PLATFORMS[number]["id"];
const INITIALS: Record<CodingPlatformId, string> = { leetcode: "LC", codeforces: "CF" };

function cleanHandle(raw: string): string {
  let s = raw.trim().replace(/\/+$/, "");
  if (s.includes("/")) s = s.split("/").pop()!;
  return s.replace(/^@/, "");
}

function CodingProfilesCard() {
  const { data, isLoading, mutate } = usePlatformProfiles();
  const handles: Record<string, string> = data?.handles ?? {};
  const stats: Record<string, any> = data?.stats ?? {};

  const [editing, setEditing] = useState<CodingPlatformId | null>(null);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const openEdit = (id: CodingPlatformId) => { setEditing(id); setInput(handles[id] ?? ""); };
  const closeEdit = () => { setEditing(null); setInput(""); };

  const handleSave = async () => {
    if (!editing) return;
    const handle = cleanHandle(input);
    if (!handle) { toast.error("Enter a valid username or URL."); return; }
    setSaving(true);
    try {
      await savePlatformHandle(editing, handle);
      closeEdit();
      toast.success(`${CODING_PLATFORMS.find(p => p.id === editing)!.name} linked!`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save.");
    } finally { setSaving(false); }
  };

  const handleDisconnect = async (id: CodingPlatformId) => {
    try { await savePlatformHandle(id, null); toast.success("Disconnected."); }
    catch { toast.error("Failed to disconnect."); }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Coding Profiles</h3>
        <button onClick={async () => { setSyncing(true); await mutate(); setSyncing(false); }}
          disabled={syncing} className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-40" title="Refresh stats">
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-3">
          {CODING_PLATFORMS.map(pl => {
            const handle = handles[pl.id];
            const stat = stats[pl.id];
            return (
              <div key={pl.id} className="relative overflow-hidden rounded-xl border border-gray-100">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: pl.color }} />
                <div className="pl-4 pr-3 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <PlatformLogo platform={pl.id} size={36} />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900">{pl.name}</div>
                        {handle
                          ? <div className="text-[11px] text-gray-400 truncate">@{handle}</div>
                          : <div className="text-[11px] text-gray-400 italic">Not connected</div>
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {handle && (
                        <>
                          <a href={pl.profileUrl(handle)} target="_blank" rel="noopener noreferrer"
                            className="p-1 rounded text-gray-300 hover:text-blue-500">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => handleDisconnect(pl.id)}
                            className="p-1 rounded text-gray-300 hover:text-red-400" title="Disconnect">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button onClick={() => openEdit(pl.id)}
                        className="p-1 rounded text-gray-300 hover:text-blue-500" title={handle ? "Edit" : "Connect"}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  {handle && stat && (
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-50 text-center">
                      {pl.id === "leetcode" && (
                        <>
                          <div><div className="text-xs font-bold text-gray-900">{stat.totalSolved ?? "—"}</div><div className="text-[9px] text-gray-400">Solved</div></div>
                          <div className="w-px h-4 bg-gray-100" />
                          <div><div className="text-xs font-bold text-green-600">{stat.easy ?? "—"}</div><div className="text-[9px] text-gray-400">Easy</div></div>
                          <div className="w-px h-4 bg-gray-100" />
                          <div><div className="text-xs font-bold text-blue-600">{stat.medium ?? "—"}</div><div className="text-[9px] text-gray-400">Med</div></div>
                          <div className="w-px h-4 bg-gray-100" />
                          <div><div className="text-xs font-bold text-red-500">{stat.hard ?? "—"}</div><div className="text-[9px] text-gray-400">Hard</div></div>
                          <div className="w-px h-4 bg-gray-100" />
                          <div><div className="text-xs font-bold text-gray-700">{stat.ranking ? `#${stat.ranking.toLocaleString()}` : "—"}</div><div className="text-[9px] text-gray-400">Rank</div></div>
                        </>
                      )}
                      {pl.id === "codeforces" && (
                        <>
                          <div><div className="text-xs font-bold text-gray-900">{stat.rating ?? "—"}</div><div className="text-[9px] text-gray-400">Rating</div></div>
                          <div className="w-px h-4 bg-gray-100" />
                          <div><div className="text-xs font-bold text-gray-700">{stat.maxRating ?? "—"}</div><div className="text-[9px] text-gray-400">Max</div></div>
                          <div className="w-px h-4 bg-gray-100" />
                          <div><div className="text-xs font-bold text-gray-700 capitalize">{stat.rank ?? "unrated"}</div><div className="text-[9px] text-gray-400">Rank</div></div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Not connected prompt */}
                  {!handle && (
                    <button onClick={() => openEdit(pl.id)}
                      className="mt-1 text-[11px] font-semibold text-blue-600 hover:underline">
                      + Connect {pl.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: CODING_PLATFORMS.find(p => p.id === editing)!.color }}>
                {INITIALS[editing]}
              </div>
              <div>
                <div className="font-bold text-gray-900">{handles[editing] ? "Update" : "Connect"} {CODING_PLATFORMS.find(p => p.id === editing)!.name}</div>
                <div className="text-xs text-gray-500">Enter username or paste profile URL</div>
              </div>
              <button onClick={closeEdit} className="ml-auto p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder={CODING_PLATFORMS.find(p => p.id === editing)!.placeholder}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            <div className="flex gap-2 mt-4">
              <button onClick={closeEdit} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !input.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skill Rating Slider ───────────────────────────────
function SkillSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
 const color = value >= 7 ? "bg-green-500" : value >= 5 ? "bg-blue-500" : value >= 3 ? "bg-blue-600" : "bg-red-400";
 return (
  <div>
   <div className="flex items-center justify-between mb-1.5">
    <span className="text-sm text-gray-700">{label}</span>
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${color}`}>{value}/10</span>
   </div>
   <input
    type="range"
    min={1}
    max={10}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200"
   />
  </div>
 );
}

// ── Tab 1: Overview ───────────────────────────────────
function OverviewTab({ user, onEdit }: { user: any; onEdit: () => void }) {
 const [bio, setBio] = useState(user.bio);
 const [linkedin, setLinkedin] = useState(user.linkedin);
 const [github, setGithub] = useState(user.github);
 const [editing, setEditing] = useState(false);
 const [saved, setSaved] = useState(false);
 const [isUploading, setIsUploading] = useState(false);

 const handleSave = async () => {
  try {
   // Normalize URLs: validator requires https:// prefix
   const normalizeUrl = (val: string, domain: string) => {
    if (!val || val.trim() === '') return '';
    const v = val.trim();
    if (v.startsWith('https://')) return v;
    if (v.startsWith('http://')) return v.replace('http://', 'https://');
    return `https://${v}`;
   };
   await updateProfile({
    bio,
    linkedinUrl: normalizeUrl(linkedin, 'linkedin'),
    githubUrl: normalizeUrl(github, 'github'),
   });
   setEditing(false);
   setSaved(true);
   setTimeout(() => setSaved(false), 2000);
  } catch (err: any) {
   // BUG-B FIX: Show user-visible error — previously only console.error
   const msg = err?.message || 'Failed to update profile. Please try again.';
   toast.error(msg);
   console.error("Failed to update profile", err);
   // Keep editing=true so user can retry (don't close the form on failure)
  }
 };

 const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  setIsUploading(true);
  const reader = new FileReader();
  reader.onloadend = async () => {
   const base64String = reader.result as string;
   try {
    await updateProfile({ avatarUrl: base64String });
   } catch (err) {
    console.error("Failed to upload avatar", err);
   } finally {
    setIsUploading(false);
   }
  };
  reader.readAsDataURL(file);
 };

 return (
   <div className="w-full">
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
     {/* ── Left Column: Identity, About, Social Links ── */}
     <div className="xl:col-span-5 space-y-5">
      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
       {/* Avatar */}
       <div className="relative inline-block mb-4">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg overflow-hidden">
         {user.avatarUrl ? (
           <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
         ) : (
           user.initials
         )}
        </div>
        <label
         className={`absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
         <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
         <Edit2 className="w-3.5 h-3.5 text-white" />
        </label>
       </div>

       <h2 className="font-bold text-gray-900 text-xl">{user.name}</h2>
       <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>

       <div className="border-t border-gray-100 mt-5 pt-4 grid grid-cols-2 gap-3 text-left">
        {[
         { label: "Roll", value: user.roll },
         { label: "Batch", value: user.batch },
         { label: "Branch", value: user.branch },
         { label: "XP Earned", value: `${(user.xp ?? 0).toLocaleString()} XP` },
        ].map(({ label, value }) => (
         <div key={label}>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">{label}</div>
          <div className="text-sm font-semibold text-gray-900 mt-0.5">{value}</div>
         </div>
        ))}
       </div>

       <button
        onClick={() => setEditing(true)}
        className="mt-5 w-full border border-gray-300 text-gray-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
       >
        <Edit2 className="w-3.5 h-3.5" /> Edit Profile
       </button>
      </div>

      {/* About */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
       <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">About</h3>
        {!editing ? (
         <button onClick={() => setEditing(true)} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
          <Edit2 className="w-3.5 h-3.5" /> Edit
         </button>
        ) : (
         <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-blue-700">
           <Save className="w-3 h-3" /> Save
          </button>
         </div>
        )}
       </div>

       {editing ? (
        <textarea
         value={bio}
         onChange={(e) => setBio(e.target.value.slice(0, 140))}
         rows={3}
         maxLength={140}
         className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
         placeholder="Write a short career goal or bio..."
        />
       ) : (
        <p className="text-sm text-gray-600 leading-relaxed">{bio || <span className="text-gray-400 italic">No bio added yet.</span>}</p>
       )}
       {editing && <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/140</p>}

       {saved && (
        <div className="mt-3 flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
         <Check className="w-4 h-4" /> Profile updated successfully
        </div>
       )}
      </div>

      {/* Social Links */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
       <h3 className="font-semibold text-gray-900 mb-3">Social Links</h3>
       <div className="space-y-3">
        {[
         { icon: Globe,   label: "LinkedIn", value: linkedin, setValue: setLinkedin, placeholder: "linkedin.com/in/yourname" },
         { icon: GitBranch, label: "GitHub",  value: github,  setValue: setGithub,  placeholder: "github.com/yourusername" },
        ].map(({ icon: Icon, label, value, setValue, placeholder }) => (
         <div key={label} className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
           <Icon className="w-4 h-4 text-gray-600" />
          </div>
          <input
           type="text"
           value={value}
           onChange={(e) => setValue(e.target.value)}
           placeholder={placeholder}
           className="flex-1 text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
         </div>
        ))}
       </div>
      </div>
     </div>

     {/* ── Right Column: PlacePrep Card & Coding Profiles (Images 1 & 2) ── */}
     <div className="xl:col-span-7 space-y-5">
      {/* Part 1: PlacePrep Card */}
      <PlacePrepCard
        name={user.name}
        initials={user.initials || (user.name || "ST").slice(0, 2).toUpperCase()}
        batch={user.batch}
        branch={user.branch}
        solved={(user.solved?.easy ?? 0) + (user.solved?.medium ?? 0) + (user.solved?.hard ?? 0)}
        currentStreak={user.streak ?? 0}
        bestStreak={user.bestStreak ?? user.streak ?? 0}
        xp={user.xp ?? 0}
        batchRank={user.rank}
        prepScore={typeof user.prepScore === "number" ? user.prepScore : 0}
      />

      {/* Part 2: Coding Profiles Card */}
      <CodingProfilesCard />

      {/* Part 3: Shareable Profile Card */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 shadow-sm">
       <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
         <Link2 className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
         <div className="text-sm font-bold text-blue-950">Shareable Profile</div>
         <div className="text-xs text-blue-600 truncate font-medium mt-0.5">placeprep.nst.edu/u/{user.roll || user.name?.toLowerCase().replace(/\s+/g, "") || "pranaysarkar"}</div>
        </div>
        <button
         onClick={() => {
          navigator.clipboard?.writeText(`https://placeprep.nst.edu/u/${user.roll || "pranaysarkar"}`);
          toast.success("Profile link copied!");
         }}
         className="shrink-0 text-xs font-bold text-blue-700 bg-white border border-blue-300/80 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors shadow-sm active:scale-95"
        >
         Copy Link
        </button>
       </div>
      </div>
     </div>
    </div>
   </div>
  );
}

// ── Tab 2: Career Settings ────────────────────────────
function CareerTab({ user }: { user: typeof defaultUser }) {
 const [categories, setCategories] = useState<CompanyCategory[]>(user.categories);
 const [companies, setCompanies] = useState<string[]>(user.targetCompanies);
 const [domains, setDomains] = useState<string[]>(user.domains);
 const [prepWeeks, setPrepWeeks] = useState(user.prepWeeks);
 const [skills, setSkills] = useState(user.skillRatings);
 const [showCompanyPicker, setShowCompanyPicker] = useState(false);
 const [saved, setSaved] = useState(false);

 const toggleCategory = (c: CompanyCategory) =>
  setCategories((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

 const toggleDomain = (d: string) =>
  setDomains((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

 const toggleCompany = (c: string) =>
  setCompanies((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

 const handleSave = async () => {
  try {
   await updateProfile({
    targetCategories: categories,
    targetCompanySlugs: companies.map(c => c.toLowerCase()),
    targetDomains: domains,
    prepWeeksCommitted: prepWeeks,
    topicSelfRatings: skills,
   });
   setSaved(true);
   setTimeout(() => setSaved(false), 2500);
   // BUG-H FIX: Removed dead sessionStorage.setItem("career_settings", ...) —
   // the data was never read back; real data comes from useProfile() SWR hook.
  } catch (err: any) {
   // BUG-H FIX: Show user-visible error instead of silent console.error
   toast.error(err?.message || 'Failed to save career settings. Please try again.');
   console.error("Failed to update career settings", err);
  }
 };

 return (
  <div className="space-y-6 max-w-3xl">
   {/* Company Category */}
   <div className="bg-white border border-gray-200 rounded-xl p-4">
    <h3 className="font-semibold text-gray-900 mb-1">Company Category</h3>
    <p className="text-xs text-gray-500 mb-4">Select the types of companies you are targeting.</p>
    <div className="flex flex-wrap gap-2">
     {COMPANY_CATEGORIES.map((cat) => {
      const active = categories.includes(cat);
      return (
       <button
        key={cat}
        onClick={() => toggleCategory(cat)}
        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${
         active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
        }`}
       >
        {active && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
        {cat}
       </button>
      );
     })}
    </div>
   </div>

   {/* Target Companies */}
   <div className="bg-white border border-gray-200 rounded-xl p-4">
    <div className="flex items-center justify-between mb-1">
     <h3 className="font-semibold text-gray-900">Target Companies</h3>
     <span className="text-xs text-gray-400">{companies.length} selected</span>
    </div>
    <p className="text-xs text-gray-500 mb-4">These companies shape your roadmap and practice sets.</p>
    <div className="flex flex-wrap gap-2">
     {companies.map((c) => (
      <span key={c} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm px-3 py-1.5 rounded-lg bg-gray-50">
       {c}
       <button onClick={() => toggleCompany(c)} aria-label={`Remove ${c}`}>
        <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 " />
       </button>
      </span>
     ))}
     <button
      onClick={() => setShowCompanyPicker((p) => !p)}
      className="flex items-center gap-1.5 border border-dashed border-blue-400 text-blue-600 text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 font-medium"
     >
      <Plus className="w-3.5 h-3.5" /> Add Company
     </button>
    </div>
    {showCompanyPicker && (
     <div className="mt-4 p-3 border border-gray-200 rounded-xl bg-gray-50">
      <p className="text-xs text-gray-500 mb-3">Click to add / remove companies:</p>
      <div className="flex flex-wrap gap-2">
       {ALL_COMPANIES.map((c) => {
        const selected = companies.includes(c);
        return (
         <button
          key={c}
          onClick={() => toggleCompany(c)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
           selected
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
          }`}
         >
          {selected && <Check className="w-3 h-3 inline mr-1" />}
          {c}
         </button>
        );
       })}
      </div>
     </div>
    )}
   </div>

   {/* Domain Preferences */}
   <div className="bg-white border border-gray-200 rounded-xl p-4">
    <h3 className="font-semibold text-gray-900 mb-1">Preparation Domain</h3>
    <p className="text-xs text-gray-500 mb-4">What role are you preparing for?</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
     {DOMAINS.map(({ icon: Icon, label }) => {
      const active = domains.includes(label);
      return (
       <button
        key={label}
        onClick={() => toggleDomain(label)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-medium text-left ${
         active
          ? "bg-blue-50 border-blue-500 text-blue-700"
          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50:bg-slate-800/60"
        }`}
       >
        <Icon className={`w-5 h-5 shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`} />
        {label}
        {active && <Check className="w-4 h-4 ml-auto text-blue-600" />}
       </button>
      );
     })}
    </div>
   </div>

   {/* Prep Duration */}
   <div className="bg-white border border-gray-200 rounded-xl p-4">
    <h3 className="font-semibold text-gray-900 mb-1">Roadmap Duration</h3>
    <p className="text-xs text-gray-500 mb-4">How many weeks do you want your prep roadmap to span?</p>
    <div className="flex gap-3">
     {PREP_WEEKS.map((w) => (
      <button
       key={w}
       onClick={() => setPrepWeeks(w)}
       className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold ${
        prepWeeks === w
         ? "bg-blue-600 border-blue-600 text-white shadow-sm"
         : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"
       }`}
      >
       {w}w
      </button>
     ))}
    </div>
    <p className="text-xs text-gray-400 mt-3">Current: {prepWeeks}-week plan · Changing this will regenerate your roadmap</p>
   </div>

   {/* Skill Self-Ratings */}
   <div className="bg-white border border-gray-200 rounded-xl p-4">
    <h3 className="font-semibold text-gray-900 mb-1">Self-Assessment Ratings</h3>
    <p className="text-xs text-gray-500 mb-5">Rate your confidence on each topic (1 = Beginner, 10 = Expert). This personalises your question difficulty.</p>
    <div className="space-y-5">
     {SKILL_TOPICS.map(({ id, label }) => (
      <SkillSlider
       key={id}
       label={label}
       value={skills[id]}
       onChange={(v) => setSkills((prev) => ({ ...prev, [id]: v }))}
      />
     ))}
    </div>
   </div>

   {/* Save Button */}
   <div className="flex items-center gap-3">
    <button
     onClick={handleSave}
     className="flex items-center gap-2 bg-gray-900 text-white font-semibold px-4 py-2 rounded-xl hover:bg-gray-800 "
    >
     <Save className="w-4 h-4" /> Save Career Settings
    </button>
    {saved && (
     <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
      <Check className="w-4 h-4" /> Settings saved successfully
     </div>
    )}
   </div>
  </div>
 );
}

// ── Tab 3: Performance ────────────────────────────────
function PerformanceTab({ user }: { user: typeof defaultUser }) {
 const total = user.solved.easy + user.solved.medium + user.solved.hard;
 // Real topic mastery from completions (Codolio-style strength bars)
 const { data: topicData } = useProgress();
 const topicRows = (Array.isArray(topicData) ? topicData : (topicData as any)?.data ?? []) as
   { topic: string; completed: number; total: number; percentage: number }[];

 const computedBadges: string[] = [];
 if (user.streak >= 5) computedBadges.push("5-Day Streak");
 if (total >= 1) computedBadges.push("First Solve");
 if (total >= 100) computedBadges.push("Problem Master");
 if (user.solved.hard >= 5) computedBadges.push("Speed Coder");

 // NOTE: the profile-level activity heatmap was removed — it displayed
 // fabricated estimated activity, and a real GitHub-style heatmap lives on
 // My Progress (single source of truth for activity in the portal).

 return (
  <div className="space-y-6">
   {/* Top Stats Row — Codolio-style tiles */}
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <StatTile icon={Zap} value={user.xp.toLocaleString()} label="Total XP" />
    <StatTile icon={Trophy} value={user.rank ? `#${user.rank}` : "\u2014"} label="Batch Rank" iconClasses="bg-violet-50 text-violet-600" href="/leaderboard" />
    <StatTile icon={Flame} value={`${user.streak}d`} label="Current Streak" sub={`best ${user.bestStreak ?? user.streak ?? 0}d`} iconClasses="bg-orange-50 text-orange-500" />
    <StatTile icon={Target} value={String(total)} label="Problems Solved" iconClasses="bg-cyan-50 text-cyan-600" />
   </div>

   {/* Difficulty Split — real donut */}
   <div className="bg-white border border-gray-200 rounded-xl p-5">
    <h3 className="mb-4 font-semibold text-gray-900">Difficulty Split</h3>
    <DifficultyDonut easy={user.solved.easy} medium={user.solved.medium} hard={user.solved.hard} size={130} />
   </div>

   {/* Topic Strength — real mastery from completions */}
   <div className="bg-white border border-gray-200 rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
     <h3 className="font-semibold text-gray-900">Topic Strength</h3>
     <Link href="/progress" className="text-xs font-medium text-blue-600 hover:underline">Full breakdown \u2192</Link>
    </div>
    <TopicStrength topics={topicRows} maxRows={10} />
   </div>

   {/* Problem Breakdown + Company Readiness */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Problem Breakdown */}
    <div className="bg-white border border-gray-200 rounded-xl p-4">
     <h3 className="font-semibold text-gray-900 mb-4">Problem Breakdown</h3>
     <div className="flex items-center gap-4 mb-5">
      {/* Donut */}
      <div className="relative w-24 h-24 shrink-0">
       <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="38" fill="none" stroke="#F3F4F6" strokeWidth="12" />
        {total > 0 && (
         <>
          <circle cx="48" cy="48" r="38" fill="none" stroke="#10B981" strokeWidth="12"
           strokeDasharray={`${(user.solved.easy / total) * 238.8} 238.8`} />
          <circle cx="48" cy="48" r="38" fill="none" stroke="#F59E0B" strokeWidth="12"
           strokeDasharray={`${(user.solved.medium / total) * 238.8} 238.8`}
           strokeDashoffset={`-${(user.solved.easy / total) * 238.8}`} />
          <circle cx="48" cy="48" r="38" fill="none" stroke="#EF4444" strokeWidth="12"
           strokeDasharray={`${(user.solved.hard / total) * 238.8} 238.8`}
           strokeDashoffset={`-${((user.solved.easy + user.solved.medium) / total) * 238.8}`} />
         </>
        )}
       </svg>
       <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-gray-900">{total}</div>
      </div>
      <div className="space-y-2 flex-1">
       {[
        { label: "Easy", count: user.solved.easy, color: "bg-green-500" },
        { label: "Medium", count: user.solved.medium, color: "bg-blue-600" },
        { label: "Hard", count: user.solved.hard, color: "bg-red-500" },
       ].map(({ label, count, color }) => (
        <div key={label} className="flex items-center justify-between">
         <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-sm text-gray-600">{label}</span>
         </div>
         <span className="text-sm font-semibold text-gray-900">{count}</span>
        </div>
       ))}
      </div>
     </div>
    </div>

    {/* Company Readiness — with real logos */}
    <div className="bg-white border border-gray-200 rounded-xl p-4">
     <h3 className="font-semibold text-gray-900 mb-4">Company Readiness</h3>
     <div className="space-y-4">
      {user.companyReadiness.map(({ name, pct }) => (
       <div key={name}>
        <div className="flex items-center gap-2 mb-1.5">
         {/* Real company favicon */}
<CompanyLogo name={name.toLowerCase()} size={28} />
         <span className="text-sm font-medium text-gray-700 flex-1">{name}</span>
         <span className="text-sm font-bold text-gray-900">{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
         <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
        </div>
       </div>
      ))}
     </div>
    </div>
   </div>

   {/* Activity heatmap lives on My Progress — single source of truth */}
   <Link
    href="/progress"
    className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group"
   >
    <div className="flex items-center gap-3">
     <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center">
      <Flame className="w-4.5 h-4.5 text-green-600" />
     </div>
     <div>
      <h3 className="font-semibold text-gray-900 text-sm">Activity &amp; Streaks</h3>
      <p className="text-xs text-gray-500">View your past-year activity heatmap on the Progress page</p>
     </div>
    </div>
    <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
   </Link>

   {/* Badges */}
   <div className="bg-white border border-gray-200 rounded-xl p-4">
    <h3 className="font-semibold text-gray-900 mb-4">Badges Earned</h3>
    <div className="flex flex-wrap gap-3">
     {computedBadges.map((badge) => (
      <div key={badge} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-medium px-4 py-2 rounded-xl">
       <Trophy className="w-4 h-4 text-indigo-500" />
       {badge}
      </div>
     ))}
     <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-300 text-gray-400 text-sm px-4 py-2 rounded-xl">
      <Plus className="w-4 h-4" /> More to unlock
     </div>
    </div>
   </div>
  </div>
 );
}

// ── Tab 4: Settings ─────────────────────────────────────
function SettingsTab() {
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [showResetConfirm, setShowResetConfirm] = useState(false);

 // Change password form state
 const [pwForm, setPwForm] = useState({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
 });
 const [pwLoading, setPwLoading] = useState(false);

 const handleChangePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  if (pwForm.newPassword !== pwForm.confirmPassword) {
   const { toast } = await import("sonner");
   toast.error("New passwords do not match.");
   return;
  }
  if (pwForm.newPassword.length < 8) {
   const { toast } = await import("sonner");
   toast.error("New password must be at least 8 characters.");
   return;
  }
  setPwLoading(true);
  try {
   const { changePassword } = await import("@/lib/hooks");
   const { toast } = await import("sonner");
   await changePassword({
    currentPassword: pwForm.currentPassword,
    newPassword: pwForm.newPassword,
   });
   toast.success("Password changed successfully.");
   setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  } catch (err: any) {
   const { toast } = await import("sonner");
   toast.error(err?.message ?? "Failed to change password.");
  } finally {
   setPwLoading(false);
  }
 };

 const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

 return (
  <div className="space-y-5 max-w-2xl">
   {/* Account Info */}
   <div className="bg-white border border-gray-200 rounded-xl p-4">
    <h3 className="font-semibold text-gray-900 mb-2">Account</h3>
    <p className="text-sm text-gray-500">Logged in as <span className="font-medium text-gray-800">pranay.sarkar@nst.edu</span></p>
    <p className="text-xs text-gray-400 mt-1">Contact your admin to change your registered email.</p>
   </div>

   {/* Change Password */}
   <div className="bg-white border border-gray-200 rounded-xl p-4">
    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
     <Shield className="w-4 h-4 text-blue-600" /> Change Password
    </h3>
    <form onSubmit={handleChangePassword} className="space-y-3">
     <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Current password</label>
      <input
       type="password"
       className={inputCls}
       placeholder="Enter current password"
       value={pwForm.currentPassword}
       onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
       required
       autoComplete="current-password"
      />
     </div>
     <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
      <input
       type="password"
       className={inputCls}
       placeholder="At least 8 characters"
       value={pwForm.newPassword}
       onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
       required
       minLength={8}
       autoComplete="new-password"
      />
     </div>
     <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Confirm new password</label>
      <input
       type="password"
       className={inputCls}
       placeholder="Repeat new password"
       value={pwForm.confirmPassword}
       onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
       required
       autoComplete="new-password"
      />
     </div>
     <button
      type="submit"
      disabled={pwLoading}
      className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
     >
      {pwLoading ? "Changing..." : "Change Password"}
     </button>
    </form>
   </div>

   {/* Danger Zone */}
   <div className="bg-red-50 border border-red-200 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-1">
     <AlertTriangle className="w-5 h-5 text-red-500" />
     <h3 className="font-semibold text-red-700">Danger Zone</h3>
    </div>
    <p className="text-xs text-gray-500 mb-5">These actions are irreversible. Proceed with extreme caution.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Retake Assessment */}
      <div>
       <button
        onClick={() => setShowResetConfirm(true)}
        className="w-full border border-red-300 text-red-600 text-sm font-medium py-3 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
       >
        <RotateCcw className="w-4 h-4" /> Retake Onboarding
       </button>
       {showResetConfirm && (
        <div className="mt-2 p-3 bg-white border border-red-300 rounded-lg text-xs text-gray-600">
         This will clear your skill ratings and restart onboarding.{" "}
         <button 
          onClick={async () => {
           try {
            const { resetOnboarding } = await import("@/lib/hooks");
            await resetOnboarding();
            window.location.href = "/onboarding";
           } catch (e) { console.error(e); }
          }}
          className="text-red-600 font-semibold underline"
         >
          Confirm
         </button>{" "}
         ·{" "}
         <button onClick={() => setShowResetConfirm(false)} className="text-gray-500 underline">Cancel</button>
        </div>
       )}
      </div>
      {/* Reset Roadmap */}
      <div>
       <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full bg-red-600 text-white text-sm font-medium py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
       >
        <Trash2 className="w-4 h-4" /> Reset Roadmap Progress
       </button>
       {showDeleteConfirm && (
        <div className="mt-2 p-3 bg-white border border-red-300 rounded-lg text-xs text-gray-600">
         All roadmap progress will be permanently deleted.{" "}
         <button 
          onClick={async () => {
           try {
            const { resetRoadmap } = await import("@/lib/hooks");
            await resetRoadmap();
            window.location.reload();
           } catch (e) { console.error(e); }
          }}
          className="text-red-600 font-semibold underline"
         >
          Confirm Reset
         </button>{" "}
         ·{" "}
         <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-500 underline">Cancel</button>
        </div>
       )}
      </div>
    </div>
   </div>
  </div>
 );
}


// ── Main Profile Page ─────────────────────────────────
function ProfilePageInner() {
  usePageTitle("Profile");
 const [activeTab, setActiveTab] = useState<Tab>("overview");

 const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview",   label: "Overview",     icon: User },
  { id: "career",    label: "Career Settings",  icon: Target },
  { id: "performance", label: "Performance",    icon: BarChart2 },
  { id: "settings",   label: "Settings", icon: Settings },
 ];

 // ── Real user data from backend ──────────────────────
 const { data: rawProfile, isLoading: profileLoading, error: profileError, mutate: retryProfile } = useProfile();
 const { data: roadmaps, isLoading: roadmapsLoading, error: roadmapsError, mutate: retryRoadmaps } = useRoadmap();
 // CODEOLIO-PARITY: real stats power the header card + performance tab — the old
 // page silently fell back to defaultUser mock numbers for solved/rank.
 const { data: dashData } = useDashboard();
 const dashStats = dashData?.stats ?? {};

 // Merge real data over defaults — real fields take precedence
 const user = {
  ...defaultUser,
  ...(rawProfile ? {
   name:   rawProfile.fullName   ?? defaultUser.name,
   email:  rawProfile.email     ?? defaultUser.email,
   roll:   rawProfile.studentId  ?? defaultUser.roll,
   branch:  rawProfile.branch    ?? defaultUser.branch,
   batch:  rawProfile.batch     ?? defaultUser.batch,
   bio:   rawProfile.bio      ?? defaultUser.bio,
   linkedin: rawProfile.linkedinUrl ?? defaultUser.linkedin,
   github:  rawProfile.githubUrl  ?? defaultUser.github,
   xp:    rawProfile.xpTotal    ?? defaultUser.xp,
   rank:   rawProfile.rank      ?? defaultUser.rank,
   streak:  rawProfile.currentStreakDays ?? defaultUser.streak,
   solved:  rawProfile.solved    ?? defaultUser.solved,
   avatarUrl: rawProfile.avatarUrl ?? defaultUser.avatarUrl,
   categories: rawProfile.targetCategories?.length > 0 ? rawProfile.targetCategories : defaultUser.categories,
   targetCompanies: rawProfile.targetCompanySlugs?.length > 0 ? rawProfile.targetCompanySlugs.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)) : defaultUser.targetCompanies,
   domains: rawProfile.targetDomains?.length > 0 ? rawProfile.targetDomains : defaultUser.domains,
   prepWeeks: rawProfile.prepWeeksCommitted ?? defaultUser.prepWeeks,
   skillRatings: (rawProfile.topicSelfRatings && Object.keys(rawProfile.topicSelfRatings).length > 0) ? rawProfile.topicSelfRatings : defaultUser.skillRatings,
  } : {}),
  // REAL STATS override — never render mock numbers when dashboard data exists
  ...(dashStats.problemsSolved != null ? {
    xp:     dashStats.xpTotal ?? 0,
    streak: dashStats.currentStreakDays ?? 0,
    bestStreak: dashStats.bestStreakDays ?? 0,
    rank:   dashStats.batchRank ?? null,
    prepScore: dashStats.prepScore ?? 0,
    solved: {
      easy:   dashStats.easySolved ?? 0,
      medium: dashStats.mediumSolved ?? 0,
      hard:   dashStats.hardSolved ?? 0,
    },
  } : {}),
  ...(roadmaps ? {
   companyReadiness: roadmaps.map((r: any) => {
    const slug = (r.companySlug || "").toLowerCase();
    const fallbackLogos: Record<string, string> = {
      google: "https://lh3.googleusercontent.com/aida-public/AB6AXuAL63YaQlCTo09Zku1cqyIzG3xEfrukR1_1YSdNH_fIn7sACmgE3gMisae0jNWnL0JspExkSlRVTEn2HMKGIqxn85PUIKwxBKN8PIULnXETMPCZ3kiSGLD3HcvmPl4ZTcxGe8HX8znSZPig8KoQPRjH7uk063p0IthnhZFKqsEXuZZbCZza_UjwhEBmarO-o6dTaP-w2tbIEds4hw0OKzoBlncRUzUs1J_7hawmfRX6tGd4NntS9WbWxKn94uAsOHqBgTSK4AnYHBhf",
      amazon: "https://lh3.googleusercontent.com/aida-public/AB6AXuCVGzGyzCRo-X8CIdRm1Aatp6lKupjl_G42KpNqwN5zGBZYFUckrUJ17QtrE4Dfgr4ma_wSEZGZWCY7mdk9QJ0VdFF0ONtcf9_iQW6bJ_s1UhlKZsKGPf4omDhc9dqKCR6m_iRD55aytexKO28l7quQXn_n1dxjJz1xdA8oWjMtfX9PD2uMdTCY5kpBQaRj7ni1lJnOOy2o1hn5DLo4VqT4Fij8WuIa61zMPXxkFMJaPNjPU4pxcrhhuq-9IZbksafPxtvW73ZZfu63",
      microsoft: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhuXLkHZDPcAy4XvMJPw67imDyTAjmHdup2A9VGo3-SRjKRfu_LOT4Iu7ZE8UtCS8alFYSfPYPemKC2iKUDzKFaF9UhAcyfMfNKlqXu51iUwdCu3yI8kpFeuCsqfyFapD9wJiP3KA_nd02x1I-6FgNYU9DJuT-3lX0OXstdNIGrZI8yxa9klG0shaBqrBUtHHZwI5hnOr_Ii2XWyquuKQDDZc-OWY3NBQ00ctZeG1-mboNBLU_r71miQbay8cIMfuG-mOwCjOOrzgG",
      oracle: "https://lh3.googleusercontent.com/aida-public/AB6AXuBt--Bjh49LYHRDqjL-sGCT5qd5lGsNgmCPazwoRF50sqWcFZYzOCwddHULAy0oVZ-UqkPpMZt1b0orruHo7HKjB2d23i5n4wEN_QpRDgUNRoS21qLVtOiraT9qQffLakfduOiyK18liwk04Qdg6uyKocz4Q_ujX9gA-AgBAeXMOmiWDcRDI87XWSHJCDCgHI7GpqfXQA5meH5HaxFU0YaWxYONZZmKSPpJlIu0GqYVfOujjdy-mGD8-DoP9qrSz7w887D2Sy6DDkBC",
      "goldman-sachs": "https://lh3.googleusercontent.com/aida-public/AB6AXuDdcYKnUW5FRfN85A6hcvfcQc4YWouCSzoIAHEXhesOXOl5lBcmldkCmnI5E8AZ6keWKUVO_VvARuVV-5VfLSnljZfksDSx1ODaI6Diuik2ZhzRBlZ5TyHWJP8dcOl_d6oHMKDtcmfh6vyry8FUrSEzjfIkC4m27wq8eGPJhyNIDH1uG98va-z_rkEd3UXd6AgtUvZHOR1VymVKgYhW04Ci4pLqJFAIADg58zfR_O7BZF9o6LW_yxuUjGTJRvAGOtIvrAHmQwzzHHW9",
      uber: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_9GpoBxbsK9qtZSMXC828cF1TybC934juVeq1JZMNymJ8sCTfx3EU9IsvTQ7iCPHVnaXm-Ji0f1kOXZbiL_Qe64l8GA6CP0ncofY_jXfmMOVf6cuylumvNf95IFA7VpUGKo93yS9tKpKtMMEZ-Ed4heMDq7YmD9QDteFo2_-wwlXbGiGgTUE0RLE78OqOuDOLHRLI90GHxnlqcJATDF3-L_EDoZWmZdVZ0EWwyjZyJqwF8lhIQfL0QqI3YELn94SPrUsiHQOZcJJ6",
      meta: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
      apple: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
      netflix: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
      flipkart: "https://upload.wikimedia.org/wikipedia/commons/1/18/Flipkart_logo.png",
      tcs: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg",
      atlassian: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Atlassian_logo.svg",
      razorpay: "https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
    };
    return {
      name: r.companyName || r.companySlug,
      pct: r.pctComplete || 0,
      logo: r.companyLogoUrl || fallbackLogos[slug] || `https://www.google.com/s2/favicons?domain=${r.companySlug}.com&sz=64`
    };
   })
  } : {}),
 };

 // Without this, a failed profile fetch left the defaultUser placeholder data
 // rendering as if it were the signed-in student's real profile.
 if (profileError || roadmapsError) {
  return (
   <ErrorState
    error={profileError ?? roadmapsError}
    title="Couldn't load your profile"
    onRetry={() => { retryProfile(); retryRoadmaps(); }}
   />
  );
 }

 if (profileLoading || roadmapsLoading) {
  return (
   <div className="w-full animate-pulse">
    <div className="mb-6">
     <div className="h-8 bg-gray-100 rounded w-32 mb-2" />
     <div className="h-4 bg-gray-100 rounded w-64" />
    </div>
    {/* Tab bar skeleton */}
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
     {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-28 bg-gray-200 rounded-lg" />)}
    </div>
    {/* Content area skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
     <div className="h-64 bg-gray-100 rounded-xl" />
     <div className="lg:col-span-2 space-y-4">
      <div className="h-40 bg-gray-100 rounded-xl" />
      <div className="h-48 bg-gray-100 rounded-xl" />
     </div>
    </div>
   </div>
  );
 }

 return (
  <div className="w-full">
   {/* Page Header */}
   <div className="mb-6">
    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
    <p className="text-sm text-gray-500 mt-0.5">Manage your account, career goals, and preferences.</p>
   </div>

   {/* Tab Navigation */}
   <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
    {tabs.map(({ id, label, icon: Icon }) => (
     <button
      key={id}
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
       activeTab === id
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-500 hover:text-gray-700"
      }`}
     >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:block">{label}</span>
     </button>
    ))}
   </div>

   {/* Tab Content */}
   {activeTab === "overview"  && <OverviewTab  user={user} onEdit={() => setActiveTab("career")} />}
   {activeTab === "career"   && <CareerTab   user={user} />}
   {activeTab === "performance" && <PerformanceTab user={user} />}
   {activeTab === "settings"  && <SettingsTab />}
  </div>
 );
}


// Admin feature-toggle gate is not required for Profile (core), but keep
// naming consistent with other pages.
export default function ProfilePage() {
  return (
    <ProfilePageInner />
  );
}
