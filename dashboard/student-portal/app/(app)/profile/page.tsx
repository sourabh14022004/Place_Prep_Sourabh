"use client";
import { useState, useEffect } from "react";
import {
 User, Settings, BarChart2, Bell,
 Edit2, Flame, RotateCcw, Trash2, AlertTriangle,
 X, Plus, Check, Save, Link2, Globe, GitBranch,
 Zap, Trophy, Target, Code2, TrendingUp, BookOpen,
 Shield, Eye, ChevronRight, LogOut,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";

// ── Types ────────────────────────────────────────────
type Tab = "overview" | "career" | "performance" | "settings";

// ── Mock Data (replace with backend later) ───────────
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

const mockUser = {
 name: "Pranay Sarkar",
 initials: "PS",
 email: "pranay.sarkar@nst.edu",
  imageUrl: "" as string | undefined,
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
function OverviewTab({ user, onEdit }: { user: typeof mockUser; onEdit: () => void }) {
 const [bio, setBio] = useState(user.bio);
 const [linkedin, setLinkedin] = useState(user.linkedin);
 const [github, setGithub] = useState(user.github);
 const [editing, setEditing] = useState(false);
 const [saved, setSaved] = useState(false);

 const handleSave = () => {
  setEditing(false);
  setSaved(true);
  setTimeout(() => setSaved(false), 2000);
  // BACKEND TODO: PUT /api/user/profile
 };

 return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
   {/* Profile Card */}
   <div className="lg:col-span-1">
    <div className="bg-white border border-gray-200 rounded-md p-4 text-center">
     {/* Avatar */}
     <div className="relative inline-block mb-4">
      {user.imageUrl ? (
       <img
        src={user.imageUrl}
        alt={user.name}
        className="w-24 h-24 rounded-lg object-cover shadow-lg border border-gray-200"
       />
      ) : (
       <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg">
        {user.initials}
       </div>
      )}
      <button
       className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 "
       aria-label="Change avatar"
      >
       <Edit2 className="w-3.5 h-3.5 text-white" />
      </button>
     </div>

     <h2 className="font-bold text-gray-900 text-xl">{user.name}</h2>
     <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>

     <div className="border-t border-gray-100 mt-5 pt-4 grid grid-cols-2 gap-3 text-left">
      {[
       { label: "Roll", value: user.roll },
       { label: "Batch", value: user.batch },
       { label: "Branch", value: user.branch },
       { label: "XP Earned", value: `${user.xp.toLocaleString()} XP` },
      ].map(({ label, value }) => (
       <div key={label}>
        <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
        <div className="text-sm font-semibold text-gray-900 mt-0.5">{value}</div>
       </div>
      ))}
     </div>

     <button
      onClick={() => setEditing(true)}
      className="mt-5 w-full border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-2"
     >
      <Edit2 className="w-3.5 h-3.5" /> Edit Profile
     </button>
    </div>

    {/* Quick Stats */}
    <div className="mt-4 bg-white border border-gray-200 rounded-md p-4">
     <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Stats</h3>
     <div className="space-y-3">
      <div className="flex items-center justify-between">
       <span className="text-sm text-gray-600">Global Rank</span>
       <span className="text-sm font-bold text-indigo-600">#{user.rank}</span>
      </div>
      <div className="flex items-center justify-between">
       <span className="text-sm text-gray-600">Problems Solved</span>
       <span className="text-sm font-semibold text-gray-900">{user.solved.easy + user.solved.medium + user.solved.hard}</span>
      </div>
      <div className="flex items-center justify-between">
       <span className="text-sm text-gray-600">Current Streak</span>
        <span className="flex items-center gap-1.5 bg-violet-50 text-violet-700 text-xs font-bold px-2.5 py-1 rounded">
         <Flame className="w-3.5 h-3.5" /> {user.streak} Days
        </span>
      </div>
     </div>
    </div>
   </div>

   {/* Bio & Links */}
   <div className="lg:col-span-2 space-y-5">
    {/* Bio Card */}
    <div className="bg-white border border-gray-200 rounded-md p-4">
     <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-gray-900">About</h3>
      {!editing ? (
       <button onClick={() => setEditing(true)} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
        <Edit2 className="w-3.5 h-3.5" /> Edit
       </button>
      ) : (
       <div className="flex gap-2">
        <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        <button onClick={handleSave} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 ">
         <Save className="w-3.5 h-3.5" /> Save
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
    <div className="bg-white border border-gray-200 rounded-md p-4">
     <h3 className="font-semibold text-gray-900 mb-4">Social Links</h3>
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

    {/* Public Profile Link */}
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
     <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
       <Link2 className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
       <div className="text-sm font-semibold text-blue-900">Shareable Profile</div>
       <div className="text-xs text-blue-600 truncate">placeprep.nst.edu/u/pranaysarkar</div>
      </div>
      <button className="shrink-0 text-xs font-semibold text-blue-700 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-100 ">
       Copy Link
      </button>
     </div>
    </div>
   </div>
  </div>
 );
}

// ── Tab 2: Career Settings ────────────────────────────
function CareerTab({ user }: { user: typeof mockUser }) {
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

 const handleSave = () => {
  setSaved(true);
  setTimeout(() => setSaved(false), 2500);
  // BACKEND TODO: PUT /api/user/profile/career
  // Also write to sessionStorage to sync roadmap
  sessionStorage.setItem("career_settings", JSON.stringify({ categories, companies, domains, prepWeeks, skills }));
 };

 return (
  <div className="space-y-6 max-w-3xl">
   {/* Company Category */}
   <div className="bg-white border border-gray-200 rounded-md p-4">
    <h3 className="font-semibold text-gray-900 mb-1">Company Category</h3>
    <p className="text-xs text-gray-500 mb-4">Select the types of companies you are targeting.</p>
    <div className="flex flex-wrap gap-2">
     {COMPANY_CATEGORIES.map((cat) => {
      const active = categories.includes(cat);
      return (
       <button
        key={cat}
        onClick={() => toggleCategory(cat)}
        className={`px-4 py-2 rounded-md text-sm font-semibold border-2 ${
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
   <div className="bg-white border border-gray-200 rounded-md p-4">
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
     <div className="mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
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
   <div className="bg-white border border-gray-200 rounded-md p-4">
    <h3 className="font-semibold text-gray-900 mb-1">Preparation Domain</h3>
    <p className="text-xs text-gray-500 mb-4">What role are you preparing for?</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
     {DOMAINS.map(({ icon: Icon, label }) => {
      const active = domains.includes(label);
      return (
       <button
        key={label}
        onClick={() => toggleDomain(label)}
        className={`flex items-center gap-3 px-4 py-3 rounded-md border-2 text-sm font-medium text-left ${
         active
          ? "bg-blue-50 border-blue-500 text-blue-700"
          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
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
   <div className="bg-white border border-gray-200 rounded-md p-4">
    <h3 className="font-semibold text-gray-900 mb-1">Roadmap Duration</h3>
    <p className="text-xs text-gray-500 mb-4">How many weeks do you want your prep roadmap to span?</p>
    <div className="flex gap-3">
     {PREP_WEEKS.map((w) => (
      <button
       key={w}
       onClick={() => setPrepWeeks(w)}
       className={`flex-1 py-3 rounded-md border-2 text-sm font-bold ${
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
   <div className="bg-white border border-gray-200 rounded-md p-4">
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
     className="flex items-center gap-2 bg-gray-900 text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-800 "
    >
     <Save className="w-4 h-4" /> Save Career Settings
    </button>
    {saved && (
     <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-md px-3 py-1.5">
      <Check className="w-4 h-4" /> Settings saved successfully
     </div>
    )}
   </div>
  </div>
 );
}

// ── Tab 3: Performance ────────────────────────────────
function PerformanceTab({ user }: { user: typeof mockUser }) {
 const total = user.solved.easy + user.solved.medium + user.solved.hard;

 const computedBadges: string[] = [];
 if (user.streak >= 5) computedBadges.push("5-Day Streak");
 if (total >= 1) computedBadges.push("First Solve");
 if (total >= 100) computedBadges.push("Problem Master");
 if (user.solved.hard >= 5) computedBadges.push("Speed Coder");

 // Generate 364 days (52 weeks) of dummy activity — proper GitHub heatmap dimensions
 const heatmapData = Array.from({ length: 364 }, (_, i) => {
  const rand = Math.random();
  // Simulate a realistic activity pattern: more active on weekdays, some heavy days
  const dayOfWeek = i % 7;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) return rand > 0.85 ? 1 : 0;
  if (rand > 0.55) return rand > 0.85 ? 3 : rand > 0.72 ? 2 : 1;
  return 0;
 });

 const getHeatmapColor = (v: number) =>
  v === 0 ? "bg-gray-100" : v === 1 ? "bg-green-300" : v === 2 ? "bg-green-500" : "bg-green-700";

 // Group into 52 weeks (columns) × 7 days (rows)
 const weeks: number[][] = [];
 for (let w = 0; w < 52; w++) {
  weeks.push(heatmapData.slice(w * 7, w * 7 + 7));
 }

 const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
 const DAY_LABELS = ["Sun","","Tue","","Thu","","Sat"];

 return (
  <div className="space-y-6">
   {/* Top Stats Row */}
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[
     { label: "Total XP", value: `${user.xp.toLocaleString()}`, icon: Zap, color: "text-blue-600 bg-blue-50 border-blue-200" },
     { label: "Global Rank", value: `#${user.rank}`, icon: Trophy, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
     { label: "Day Streak", value: `${user.streak}`, icon: Flame, color: "text-violet-600 bg-violet-50 border-violet-200" },
     { label: "Problems Solved", value: `${total}`, icon: Target, color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
    ].map(({ label, value, icon: Icon, color }) => (
     <div key={label} className="bg-white border border-gray-200 rounded-md p-4">
      <div className={`w-8 h-8 rounded flex items-center justify-center border mb-3 ${color}`}>
       <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-black text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
     </div>
    ))}
   </div>

   {/* Problem Breakdown + Company Readiness */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Problem Breakdown */}
    <div className="bg-white border border-gray-200 rounded-md p-4">
     <h3 className="font-semibold text-gray-900 mb-4">Problem Breakdown</h3>
     <div className="flex items-center gap-4 mb-5">
      {/* Donut */}
      <div className="relative w-24 h-24 shrink-0">
       <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="38" fill="none" stroke="#F3F4F6" strokeWidth="12" />
        <circle cx="48" cy="48" r="38" fill="none" stroke="#10B981" strokeWidth="12"
         strokeDasharray={`${(user.solved.easy / total) * 238.8} 238.8`} />
        <circle cx="48" cy="48" r="38" fill="none" stroke="#F59E0B" strokeWidth="12"
         strokeDasharray={`${(user.solved.medium / total) * 238.8} 238.8`}
         strokeDashoffset={`-${(user.solved.easy / total) * 238.8}`} />
        <circle cx="48" cy="48" r="38" fill="none" stroke="#EF4444" strokeWidth="12"
         strokeDasharray={`${(user.solved.hard / total) * 238.8} 238.8`}
         strokeDashoffset={`-${((user.solved.easy + user.solved.medium) / total) * 238.8}`} />
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
    <div className="bg-white border border-gray-200 rounded-md p-4">
     <h3 className="font-semibold text-gray-900 mb-4">Company Readiness</h3>
     <div className="space-y-4">
      {user.companyReadiness.map(({ name, pct }) => (
       <div key={name}>
        <div className="flex items-center gap-2 mb-1.5">
         {/* Real company favicon */}
         {/* eslint-disable-next-line @next/next/no-img-element */}
         <img
          src={`https://www.google.com/s2/favicons?sz=16&domain=${name.toLowerCase()}.com`}
          alt={name}
          className="w-4 h-4 rounded-sm"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
         />
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

   {/* GitHub-style Activity Heatmap — 52 weeks × 7 days */}
   <div className="bg-white border border-gray-200 rounded-md p-4">
    <div className="flex items-center justify-between mb-3">
     <h3 className="font-semibold text-gray-900">Activity — Past Year</h3>
     <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
      <span>Less</span>
      {["bg-gray-100", "bg-green-300", "bg-green-500", "bg-green-700"].map((c, i) => (
       <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
      ))}
      <span>More</span>
     </div>
    </div>

    <div className="overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
      <div className="min-w-[650px]">
        {/* Month labels */}
        <div className="flex mb-1 pl-7">
         {MONTH_LABELS.map((m, i) => (
          <div key={m} className="text-[10px] text-gray-400" style={{ width: `${(1/12) * 100}%` }}>{m}</div>
         ))}
        </div>

        <div className="flex gap-0.5">
         {/* Day-of-week labels */}
         <div className="flex flex-col gap-0.5 mr-1">
          {DAY_LABELS.map((d, i) => (
           <div key={i} className="text-[9px] text-gray-400 h-3 flex items-center w-6 justify-end pr-1">{d}</div>
          ))}
         </div>

         {/* Weeks grid */}
         {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
           {week.map((val, di) => (
            <div
             key={di}
             title={`${val === 0 ? "No" : val} problem${val !== 1 ? "s" : ""} solved`}
             className={`w-3 h-3 rounded-sm cursor-default ${getHeatmapColor(val)}`}
            />
           ))}
          </div>
         ))}
        </div>
      </div>
    </div>

    <p className="text-xs text-gray-400 mt-3">
     {heatmapData.filter(v => v > 0).length} active days in the past year
    </p>
   </div>

   {/* Badges */}
   <div className="bg-white border border-gray-200 rounded-md p-4">
    <h3 className="font-semibold text-gray-900 mb-4">Badges Earned</h3>
    <div className="flex flex-wrap gap-3">
     {computedBadges.map((badge) => (
      <div key={badge} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm font-medium px-4 py-2 rounded-md">
       <Trophy className="w-4 h-4 text-indigo-500" />
       {badge}
      </div>
     ))}
     <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-300 text-gray-400 text-sm px-4 py-2 rounded-md">
      <Plus className="w-4 h-4" /> More to unlock
     </div>
    </div>
   </div>
  </div>
 );
}

// ── Tab 4: Settings ─────────────────────────────────────
function SettingsTab({ email, onLogout }: { email: string; onLogout: () => void }) {
 const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
 const [showResetConfirm, setShowResetConfirm] = useState(false);

 return (
  <div className="space-y-5 max-w-2xl">
   {/* Account Info */}
   <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
     <h3 className="font-semibold text-gray-900 mb-1">Account</h3>
     <p className="text-sm text-gray-500">Logged in as <span className="font-medium text-gray-800">{email}</span></p>
     <p className="text-xs text-gray-400 mt-1">Authentication managed via Clerk SSO.</p>
    </div>
    <button
     onClick={onLogout}
     className="shrink-0 flex items-center gap-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors"
    >
     <LogOut className="w-4 h-4" /> Log Out
    </button>
   </div>

   {/* Danger Zone */}
   <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
        <button className="text-red-600 font-semibold underline">Confirm</button>{" "}
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
        <button className="text-red-600 font-semibold underline">Confirm Reset</button>{" "}
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
import { fetchStudentProfile } from "@/lib/api";

export default function ProfilePage() {
 const [activeTab, setActiveTab] = useState<Tab>("overview");
 const { user: clerkUser, isLoaded } = useUser();
 const { signOut } = useClerk();
 const [liveProfile, setLiveProfile] = useState<any>(null);

 useEffect(() => {
  async function loadLiveProfile() {
   if (clerkUser?.id || clerkUser?.primaryEmailAddress?.emailAddress) {
    const data = await fetchStudentProfile(clerkUser.id, clerkUser.primaryEmailAddress?.emailAddress);
    if (data) setLiveProfile(data);
   }
  }
  loadLiveProfile();
 }, [clerkUser]);

 const realName = isLoaded && clerkUser ? (clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || mockUser.name) : (liveProfile?.name || mockUser.name);
 const realEmail = isLoaded && clerkUser ? (clerkUser.primaryEmailAddress?.emailAddress || mockUser.email) : (liveProfile?.email || mockUser.email);
 const realImage = isLoaded && clerkUser ? clerkUser.imageUrl : undefined;
 const initials = realName ? realName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "SS";

 const userProfile = {
  ...mockUser,
  name: realName,
  email: realEmail,
  imageUrl: realImage,
  initials: initials,
  xp: liveProfile?.xp ?? mockUser.xp,
  streak: liveProfile?.streakDays ?? mockUser.streak,
  targetCompanies: liveProfile?.targetCompanies && liveProfile.targetCompanies.length > 0
   ? liveProfile.targetCompanies.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1))
   : mockUser.targetCompanies,
 };

 const handleLogout = async () => {
  document.cookie = "student_authed=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "has_onboarded=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  try {
   sessionStorage.clear();
   localStorage.clear();
  } catch {}
  try {
   if (signOut) {
    await signOut({ redirectUrl: "/login" });
   }
  } catch {}
  window.location.href = "/login";
 };

 const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview",   label: "Overview",     icon: User },
  { id: "career",    label: "Career Settings",  icon: Target },
  { id: "performance", label: "Performance",    icon: BarChart2 },
  { id: "settings",   label: "Settings", icon: Settings },
 ];

 return (
  <div className="max-w-5xl">
   {/* Page Header */}
   <div className="mb-6">
    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
    <p className="text-sm text-gray-500 mt-0.5">Manage your account, career goals, and preferences.</p>
   </div>

   {/* Tab Navigation */}
   <div className="flex gap-1 bg-gray-100 rounded-md p-1 mb-6 w-fit">
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
   {activeTab === "overview"  && <OverviewTab  user={userProfile} onEdit={() => setActiveTab("career")} />}
   {activeTab === "career"   && <CareerTab   user={userProfile} />}
   {activeTab === "performance" && <PerformanceTab user={userProfile} />}
   {activeTab === "settings"  && <SettingsTab email={realEmail} onLogout={handleLogout} />}
  </div>
 );
}
