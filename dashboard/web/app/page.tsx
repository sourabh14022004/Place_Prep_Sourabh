import Link from "next/link";
import {
  ArrowRight, BarChart3, Building2, CalendarCheck, CheckCircle2,
  ChevronDown, Flame, GraduationCap, LayoutDashboard, Map as MapIcon,
  MessageCircle, PlayCircle, Sparkles, Target, Trophy, Zap,
} from "lucide-react";

// JSON-LD structured data — rich search results for the public landing page.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PlacePrep",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  description:
    "Structured, data-driven interview preparation portal built exclusively for NST students. Company-specific roadmaps, real interview questions and progress analytics.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
};

const NAV = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Preview", href: "#preview" },
  { label: "FAQ", href: "#faq" },
];

const FEATURES = [
  {
    icon: MapIcon,
    title: "Company-Specific Roadmaps",
    desc: "Pick your target company and role — get a week-by-week plan built from that company's actual topic frequency, tuned to your skill level.",
    accent: "from-blue-500 to-indigo-600",
  },
  {
    icon: Target,
    title: "Real Interview Questions",
    desc: "Thousands of questions actually asked at Google, Microsoft, Amazon, Flipkart and more — tagged by round, topic, difficulty and frequency.",
    accent: "from-violet-500 to-purple-600",
  },
  {
    icon: CheckCircle2,
    title: "Interactive MCQ Practice",
    desc: "Aptitude and core-CS quizzes with instant checking, explanations and progress tracking — not just PDFs of past papers.",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    desc: "GitHub-style activity heatmap, topic mastery bars, difficulty split and readiness scores per company. Every solve counts, visibly.",
    accent: "from-cyan-500 to-sky-600",
  },
  {
    icon: Flame,
    title: "Streaks, XP & Leaderboards",
    desc: "Daily streaks, XP for every solved question and batch leaderboards that make consistency addictive.",
    accent: "from-amber-500 to-orange-600",
  },
  {
    icon: MessageCircle,
    title: "Faculty Mentorship",
    desc: "Ask doubts directly to faculty, book 1:1 mentoring sessions and get unblocked fast — inside the same portal.",
    accent: "from-pink-500 to-rose-600",
  },
];

const STEPS = [
  {
    n: "01",
    icon: GraduationCap,
    title: "Tell us your target",
    desc: "Choose target domains, dream companies and rate yourself Beginner / Intermediate / Advanced on each topic.",
  },
  {
    n: "02",
    icon: MapIcon,
    title: "Get your roadmap",
    desc: "We sequence topics by interview frequency × your weak areas, and fill every week with that company's real questions.",
  },
  {
    n: "03",
    icon: Trophy,
    title: "Solve, track, repeat",
    desc: "Mark questions done, keep your streak alive, watch readiness climb — until the offer letter arrives.",
  },
];

const STATS = [
  { value: "5,500+", label: "Verified questions" },
  { value: "676", label: "Companies covered" },
  { value: "463", label: "Interactive MCQs" },
  { value: "24 wks", label: "Roadmaps up to" },
];

const FAQ = [
  {
    q: "Who is PlacePrep for?",
    a: "Exclusively for NST students preparing for campus placements and off-campus SDE roles. Sign in with the account provided by your placement cell.",
  },
  {
    q: "How are roadmaps generated?",
    a: "Each roadmap blends three signals: how often your target company tests each topic, how confident you rated yourself on it, and how many weeks you have left. Weak-but-frequent topics come first.",
  },
  {
    q: "Are the questions real?",
    a: "Yes — scraped, cleaned and verified from real candidate reports, tagged by company, round type, topic and difficulty. MCQs include options, correct answers and full explanations.",
  },
  {
    q: "Does it cost anything?",
    a: "No. PlacePrep is free for NST students.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-blue-700 to-indigo-600 px-2 py-1 text-xs font-bold text-white">NST</div>
            <span className="text-sm font-bold tracking-tight">PlacePrep</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-gray-700 hover:text-gray-900 sm:block">
              Sign in
            </Link>
            <Link
              href="/register"
              className="group inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* dotted background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Built exclusively for NST students · Free forever
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl">
            Stop prepping blind.
            <span className="block bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Prep exactly what they ask.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            PlacePrep turns real placement data into a week-by-week roadmap for your{" "}
            <em>target company</em> — filled with the questions they actually ask, tracked down to every single day.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 sm:w-auto"
            >
              Build my roadmap
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50 sm:w-auto"
            >
              <PlayCircle className="h-4 w-4 text-blue-600" />
              See how it works
            </a>
          </div>

          {/* Stats band */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-sm sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white px-4 py-5">
                <div className="text-2xl font-black tracking-tight text-gray-900">{s.value}</div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="border-t border-gray-100 bg-gray-50/60 py-20 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Everything you need. Nothing you don&apos;t.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
              Six systems working together — so every minute you spend maps to an interview question somewhere.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gray-200 hover:shadow-lg"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow-md`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-bold tracking-tight">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how" className="py-20 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Three steps to interview-ready</h2>
          </div>
          <div className="relative grid gap-8 md:grid-cols-3">
            {/* connector line */}
            <div aria-hidden className="absolute left-[16.6%] right-[16.6%] top-10 hidden h-px bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200 md:block" />
            {STEPS.map((s) => (
              <div key={s.n} className="relative text-center">
                <div className="relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-md">
                  <s.icon className="h-7 w-7 text-blue-600" />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[10px] font-black text-white">
                    {s.n.slice(1)}
                  </span>
                </div>
                <h3 className="mb-2 font-bold tracking-tight">{s.title}</h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product preview ────────────────────────────────── */}
      <section id="preview" className="border-y border-gray-100 bg-gradient-to-b from-gray-50 to-white py-20 scroll-mt-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Your command center</h2>
            <p className="mt-3 text-sm text-gray-600 sm:text-base">One dashboard: today&apos;s tasks, readiness rings, streaks and your full-year activity.</p>
          </div>

          {/* CSS-only product mock */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/5">
            {/* window bar */}
            <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
              <div className="ml-4 hidden h-5 flex-1 rounded-md bg-gray-100 sm:block" />
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              {/* Today tasks card */}
              <div className="rounded-xl border border-gray-100 p-4 md:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Today&apos;s Tasks — Google
                </div>
                {["Two Sum II — sorted array", "LRU Cache implementation", "Design URL shortener"].map((t, i) => (
                  <div key={t} className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                    <CheckCircle2 className={`h-4 w-4 ${i === 0 ? "fill-emerald-50 text-emerald-500" : "text-gray-200"}`} />
                    <span className={`flex-1 truncate text-sm font-medium ${i === 0 ? "text-gray-400 line-through" : "text-gray-800"}`}>{t}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      i === 0 ? "bg-green-50 text-green-700" : i === 1 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"
                    }`}>
                      {i === 0 ? "Easy" : i === 1 ? "Medium" : "Hard"}
                    </span>
                    <span className="hidden items-center gap-0.5 text-xs font-semibold text-amber-600 sm:flex">
                      <Zap className="h-3 w-3 fill-amber-400 text-amber-500" />{i === 0 ? 10 : i === 1 ? 25 : 50}
                    </span>
                  </div>
                ))}
              </div>

              {/* Readiness ring card */}
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Readiness</div>
                <div className="flex items-center justify-center py-2">
                  <div className="relative h-24 w-24">
                    <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
                      <circle cx="48" cy="48" r="38" fill="none" stroke="#F3F4F6" strokeWidth="9" />
                      <circle cx="48" cy="48" r="38" fill="none" stroke="#2563eb" strokeWidth="9" strokeLinecap="round" strokeDasharray="179 239" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black">75%</span>
                      <span className="text-[9px] font-medium uppercase text-gray-400">Google</span>
                    </div>
                  </div>
                </div>
                <div className="mt-1 space-y-1.5">
                  {[["DSA", "bg-blue-500", "w-4/5"], ["Core CS", "bg-violet-500", "w-3/5"], ["HR", "bg-emerald-500", "w-2/3"]].map(([l, c, w]) => (
                    <div key={l} className="flex items-center gap-2">
                      <span className="w-12 text-[10px] text-gray-400">{l}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100"><div className={`h-1.5 ${c} rounded-full ${w}`} /></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak strip */}
              <div className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 md:col-span-3">
                <div className="flex items-center gap-2.5">
                  <Flame className="h-6 w-6 text-orange-500" />
                  <div><div className="text-lg font-black leading-none">17</div><div className="text-[10px] uppercase text-gray-400">day streak</div></div>
                </div>
                <div className="h-8 w-px bg-gray-100" />
                <div className="flex items-center gap-2.5">
                  <Trophy className="h-6 w-6 text-indigo-500" />
                  <div><div className="text-lg font-black leading-none">#4</div><div className="text-[10px] uppercase text-gray-400">batch rank</div></div>
                </div>
                <div className="ml-auto hidden gap-1 sm:flex" aria-hidden>
                  {Array.from({ length: 26 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-6 w-2.5 rounded-sm"
                      style={{ backgroundColor: [0,1,2,3,4][ (i * 7 + 3) % 5 ] === 0 ? "#ebedf0" : ["#9be9a8","#40c463","#40c463","#30a14e","#216e39"][(i*3)%5] }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
            <Building2 className="h-3.5 w-3.5" /> Roadmaps available for Google, Microsoft, Amazon, Flipkart, Razorpay, Swiggy &amp; more.
          </p>
        </div>
      </section>

      {/* ── Faculty strip ──────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-10 text-center sm:p-14">
          <CalendarCheck className="h-10 w-10 text-indigo-600" />
          <h2 className="max-w-xl text-2xl font-black tracking-tight sm:text-3xl">Stuck? Your professors are one click away.</h2>
          <p className="max-w-lg text-sm leading-relaxed text-gray-600 sm:text-base">
            Post doubts straight to faculty, or book a 1:1 mentoring session — without leaving your prep flow.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-700">
            Start prepping free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-gray-100 bg-gray-50/60 py-20 scroll-mt-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-black tracking-tight">Questions, answered</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-xl border border-gray-200 bg-white open:shadow-md [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-4 text-sm leading-relaxed text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gray-950 py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 50% 120%, rgba(37,99,235,0.45), transparent), radial-gradient(ellipse 40% 60% at 80% -20%, rgba(124,58,237,0.35), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Target className="mx-auto mb-5 h-10 w-10 text-blue-400" />
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Placement season won&apos;t wait.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-400 sm:text-base">
            Every day without a plan is a day someone else solved the question you&apos;ll get asked.
          </p>
          <Link
            href="/register"
            className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-black text-gray-900 shadow-xl transition-transform hover:scale-[1.03]"
          >
            Create my free account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 bg-gray-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-2">
            <div className="rounded bg-gradient-to-br from-blue-700 to-indigo-600 px-2 py-1 text-[10px] font-bold text-white">NST</div>
            <span className="text-sm font-bold text-white">PlacePrep</span>
          </div>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} PlacePrep by NST. Built by students, for students.</p>
          <div className="flex gap-5 text-xs text-gray-500">
            <a href="mailto:support@placeprep.app?subject=Privacy%20Policy" className="transition-colors hover:text-gray-300">Privacy Policy</a>
            <a href="mailto:support@placeprep.app?subject=Terms%20of%20Service" className="transition-colors hover:text-gray-300">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
