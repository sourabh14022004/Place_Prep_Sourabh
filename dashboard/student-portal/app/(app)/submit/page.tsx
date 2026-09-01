/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { FeatureGate } from "@/lib/features";
import { CompanyLogo } from "@/components/ui";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Plus, X, CheckCircle, Clock, XCircle, Check,
  ChevronRight, ChevronDown, ChevronUp, ThumbsUp,
  History, Code, Sparkles, Filter, ArrowUpDown, Star, Layers
} from "lucide-react";
import { mutate as globalMutate } from 'swr'; // BUG-FIX E1: live XP badge + SWR cache sync
import { useNavbar } from "@/lib/navbar-context";
import { useCompanies } from "@/lib/hooks";
import { usePageTitle } from "@/lib/use-page-title";

// BUG-EX3 FIX: Google Favicon API for logos — no broken hardcoded CDN URLs
function getCompanyLogoUrl(companyName: string): string {
  const slugMap: Record<string, string> = {
    'Google': 'google.com', 'Amazon': 'amazon.com', 'Microsoft': 'microsoft.com',
    'Meta': 'meta.com', 'Apple': 'apple.com', 'Flipkart': 'flipkart.com',
    'Uber': 'uber.com', 'Oracle': 'oracle.com', 'Adobe': 'adobe.com',
    'Goldman Sachs': 'goldmansachs.com', 'Infosys': 'infosys.com', 'TCS': 'tata.com',
    'Razorpay': 'razorpay.com', 'Swiggy': 'swiggy.com', 'Paytm': 'paytm.com',
    'Wipro': 'wipro.com', 'Accenture': 'accenture.com', 'Deloitte': 'deloitte.com',
    'Airtel': 'airtel.in', 'Netcracker': 'netcracker.com', 'Netcracker Technology': 'netcracker.com',
  };
  const domain = slugMap[companyName] || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

// BUG-EX2 FIX: Fallback list used only if API fails to load; real list comes from useCompanies()
const FALLBACK_COMPANIES = ["Google", "Amazon", "Microsoft", "Flipkart", "TCS", "Infosys", "Razorpay", "Swiggy", "Paytm", "Adobe", "Oracle", "Goldman Sachs", "Uber", "Meta", "Apple", "Wipro", "Accenture"];

interface InterviewRound {
  roundNumber: number;
  type: string;
  topics: string[];
  description: string;
  cleared: boolean;
}

interface Experience {
  id: string;
  company: string;
  logoUrl: string;
  role: string;
  roundsCount: number;
  problemsCount: number;
  outcome: string; // "offer" | "rejected" | "waiting"
  difficulty: "Easy" | "Medium" | "Hard";
  workType: string;
  experience: string;
  author: string;
  authorRole: string;
  postedAgo: string;
  createdAt?: string;
  upvotes: number;
  hasUpvoted: boolean;
  hasBookmarked: boolean;
  rounds: InterviewRound[];
}



// BUG-EX5 FIX: No longer hardcoded — fetched dynamically from DB in SubmitContent component
// Static fallback only used if API call fails (e.g. network error on load)
const FALLBACK_POPULAR_COMPANIES = [
  { name: "Amazon",       slug: "amazon",       logo: getCompanyLogoUrl("Amazon"),       type: "Product Based", count: null },
  { name: "Microsoft",    slug: "microsoft",    logo: getCompanyLogoUrl("Microsoft"),    type: "Product Based", count: null },
  { name: "Google",       slug: "google",       logo: getCompanyLogoUrl("Google"),       type: "Product Based", count: null },
  { name: "Oracle",       slug: "oracle",       logo: getCompanyLogoUrl("Oracle"),       type: "Product Based", count: null },
  { name: "Goldman Sachs",slug: "goldman-sachs",logo: getCompanyLogoUrl("Goldman Sachs"),type: "Service Based", count: null },
  { name: "Uber",         slug: "uber",         logo: getCompanyLogoUrl("Uber"),         type: "Product Based", count: null },
];

function SubmitContent() {
  const { setOnSubmitClick } = useNavbar();
  const searchParams = useSearchParams();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loadingExp, setLoadingExp] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // BUG-EX5 FIX: Dynamic popular companies from DB
  const [popularCompanies, setPopularCompanies] = useState(FALLBACK_POPULAR_COMPANIES);
  useEffect(() => {
    fetch('/api/experiences/popular-companies', { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        const companies = json?.data?.companies ?? json?.companies ?? [];
        if (Array.isArray(companies) && companies.length > 0) {
          setPopularCompanies(
            companies.map((c: any) => ({
              name: c.name || c.slug,
              slug: c.slug,
              logo: getCompanyLogoUrl(c.name || c.slug),
              type: 'Product Based',
              count: c.count,
            }))
          );
        }
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  // BUG-EX2 FIX: Load real company names from DB instead of hardcoded list
  const { data: companiesData } = useCompanies();
  const dbCompanyNames: string[] = Array.isArray(companiesData)
    ? companiesData.map((c: any) => c.name).filter(Boolean)
    : Array.isArray(companiesData?.companies)
    ? companiesData.companies.map((c: any) => c.name).filter(Boolean)
    : [];
  // Merge DB names with fallback (deduped), sorted alphabetically
  const allCompanyNames = [...new Set([...dbCompanyNames, ...FALLBACK_COMPANIES])].sort();

  // Load experiences from API on mount
  useEffect(() => {
    fetch('/api/experiences', { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        const raw = json?.data?.experiences ?? json?.experiences ?? json?.data ?? [];
        if (Array.isArray(raw) && raw.length > 0) {
          const mapped = raw.map((e: any) => ({
            id:           String(e._id ?? e.id ?? crypto.randomUUID()),
            company:      e.companyName ?? e.company ?? '',
            logoUrl:      getCompanyLogoUrl(e.companyName ?? e.company ?? ''),
            role:         e.role ?? '',
            roundsCount:  e.rounds?.length ?? e.roundsCount ?? 1,
            problemsCount: e.problemsCount ?? 0,
            outcome:      e.outcome ?? 'waiting',
            difficulty:   e.difficulty ?? 'Medium',
            workType:     e.workType ?? 'Hybrid',
            experience:   e.experienceText ?? e.experience ?? '',
            author:       e.authorName ?? e.author ?? 'Student',
            authorRole:   e.authorRole ?? 'NST Student',
            postedAgo:    e.createdAt ? new Date(e.createdAt).toLocaleDateString() : 'Recently',
            createdAt:    e.createdAt ?? undefined,
            upvotes:      e.upvoteCount ?? e.upvotes ?? 0,  // DB field is upvoteCount, not upvotes
            hasUpvoted:   e.isUpvoted ?? e.hasUpvoted ?? false,  // DB field is isUpvoted
            hasBookmarked: e.hasBookmarked ?? false,
            rounds:       (e.rounds ?? []).map((r: any, i: number) => ({
              roundNumber:  i + 1,
              type:         r.type ?? 'DSA Coding',
              topics:       r.topics ?? [],
              description:  r.description ?? '',
              cleared:      r.cleared ?? true,
            })),
          }));
          setExperiences(mapped);
        } else {
          // API returned empty, clear experiences
          setExperiences([]);
        }
      })
      .catch(() => setExperiences([]))
      .finally(() => setLoadingExp(false));
  }, []);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [xpAwarded, setXpAwarded] = useState<number>(50); // BUG-FIX E1: real XP from server response

  // Filters state
  const [filterDifficulty, setFilterDifficulty] = useState<string>("All");
  const [filterCompany, setFilterCompany] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("Most Upvoted");

  useEffect(() => {
    const expand = searchParams?.get("expand");
    if (expand) {
      // DEEP-LINK FIX: ids are Mongo ObjectId strings — parseInt mangled them so
      // dashboard → "expand this report" never matched anything.
      const id = decodeURIComponent(expand);
      if (id) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setTimeout(() => {
          setExpandedId(id);
          const found = experiences.find((e) => e.id === id);
          if (found) {
            setFilterCompany(found.company);
          }
        }, 0);
      }
    }
  }, [searchParams, experiences]);

  // Share link toast state
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Submit Form States
  const [formCompany, setFormCompany] = useState("Google");
  const [formCompanyQuery, setFormCompanyQuery] = useState("Google");
  const [formCompanySuggestions, setFormCompanySuggestions] = useState<string[]>([]);
  const [formCompanyOpen, setFormCompanyOpen] = useState(false);
  const [formRole, setFormRole] = useState("SDE-1");
  const [formDate, setFormDate] = useState("");
  const [formOutcome, setFormOutcome] = useState("offer");
  const [formStars, setFormStars] = useState(3);
  const [formExperienceText, setFormExperienceText] = useState("");
  const [formTipsText, setFormTipsText] = useState("");
  const [formRoundsCount, setFormRoundsCount] = useState<number | "">(3);
  const [formProblemsCount, setFormProblemsCount] = useState<number | "">(2);
  const [formTags, setFormTags] = useState<string[]>(["Arrays", "Dynamic Programming"]);
  const [formTagInput, setFormTagInput] = useState("");
  // Per-round detail inputs
  const [formRoundDetails, setFormRoundDetails] = useState<{type: string; topics: string; description: string; cleared: boolean}[]>(
    Array.from({ length: 3 }, (_, i) => ({ type: "DSA Coding", topics: "", description: "", cleared: true }))
  );

  // Register the modal-open callback in the Navbar via context
  const openModal = useCallback(() => {
    setShowModal(true);
    setFormSubmitted(false);
  }, []);

  useEffect(() => {
    setOnSubmitClick(openModal);
    return () => setOnSubmitClick(null);
  }, [openModal, setOnSubmitClick]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    if (showModal) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && formTagInput.trim()) {
      e.preventDefault();
      if (!formTags.includes(formTagInput.trim())) {
        setFormTags([...formTags, formTagInput.trim()]);
      }
      setFormTagInput("");
    }
  };

  // BUG-EX4 FIX: Upvote now persists via API (/api/experiences/:id/upvote)
  // Previously only updated local state — reset on every page reload
  const handleUpvote = async (id: string) => {
    // Optimistic update
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          return {
            ...exp,
            upvotes: exp.hasUpvoted ? exp.upvotes - 1 : exp.upvotes + 1,
            hasUpvoted: !exp.hasUpvoted,
          };
        }
        return exp;
      })
    );
    // Persist to API
    try {
      const res = await fetch(`/api/experiences/${id}/upvote`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        const serverData = json?.data ?? json;
        // Sync local state with server's authoritative count
        setExperiences((prev) =>
          prev.map((exp) =>
            exp.id === id
              ? { ...exp, upvotes: serverData.upvoteCount ?? exp.upvotes, hasUpvoted: serverData.isUpvoted ?? exp.hasUpvoted }
              : exp
          )
        );
      }
    } catch {
      // Rollback optimistic update on network error
      setExperiences((prev) =>
        prev.map((exp) => {
          if (exp.id === id) {
            return {
              ...exp,
              upvotes: exp.hasUpvoted ? exp.upvotes + 1 : exp.upvotes - 1,
              hasUpvoted: !exp.hasUpvoted,
            };
          }
          return exp;
        })
      );
    }
  };


  const handleCompanyQueryChange = (q: string) => {
    setFormCompanyQuery(q);
    setFormCompany(q); // allow free-text company name too
    if (q.trim().length > 0) {
      const lower = q.toLowerCase();
      // BUG-EX2 FIX: Use real DB company names from useCompanies hook
      const matches = allCompanyNames.filter((c) => c.toLowerCase().includes(lower)).slice(0, 6);
      setFormCompanySuggestions(matches);
      setFormCompanyOpen(matches.length > 0);
    } else {
      setFormCompanySuggestions([]);
      setFormCompanyOpen(false);
    }
  };

  const selectCompanySuggestion = (name: string) => {
    setFormCompany(name);
    setFormCompanyQuery(name);
    setFormCompanyOpen(false);
    setFormCompanySuggestions([]);
  };

  const clearForm = () => {
    setFormCompany("Google");
    setFormCompanyQuery("Google");
    setFormCompanyOpen(false);
    setFormCompanySuggestions([]);
    setFormRole("SDE-1");
    setFormDate("");
    setFormOutcome("offer");
    setFormStars(3);
    setFormExperienceText("");
    setFormTipsText("");
    setFormRoundsCount(3);
    setFormProblemsCount(2);
    setFormTags(["Arrays", "Dynamic Programming"]);
    setFormTagInput("");
    setFormRoundDetails(Array.from({ length: 3 }, () => ({ type: "DSA Coding", topics: "", description: "", cleared: true })));
  };

  const closeModal = () => {
    setShowModal(false);
    setFormSubmitted(false);
    clearForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formExperienceText.trim()) {
      alert("Please describe your interview experience.");
      return;
    }

    const optimisticId = `local-${Date.now()}`;
    const newExp: Experience = {
      id: optimisticId,
      company: formCompany,
      logoUrl: getCompanyLogoUrl(formCompany),
      role: formRole,
      roundsCount: Number(formRoundsCount) || 1,
      problemsCount: Number(formProblemsCount) || 1,
      outcome: formOutcome,
      difficulty: formStars <= 2 ? "Easy" : formStars <= 4 ? "Medium" : "Hard",
      workType: "Hybrid",
      experience: formExperienceText,
      author: "You (Student)",
      authorRole: "NST Student",
      postedAgo: "Just now",
      createdAt: new Date().toISOString(),
      upvotes: 0,
      hasUpvoted: false,
      hasBookmarked: false,
      rounds: formRoundDetails.slice(0, Number(formRoundsCount) || 1).map((r, i) => ({
        roundNumber: i + 1,
        type: r.type,
        topics: r.topics.split(",").map((t) => t.trim()).filter(Boolean),
        description: r.description || formExperienceText,
        cleared: r.cleared,
      })),
    };

    // Optimistic update
    setExperiences(prev => [newExp, ...prev]);
    setFormSubmitted(true);

    // POST to real API
    try {
      const res = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companySlug:       formCompany.toLowerCase().replace(/\s+/g, '-'),
          role:              formRole,
          outcome:           formOutcome,
          overallDifficulty: newExp.difficulty,
          experienceText:    formExperienceText,
          tips:              formTipsText || undefined,
          rounds:            newExp.rounds,
          roundsCount:       Number(formRoundsCount) || 1,
          interviewDate:     formDate || new Date().toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const saved = json?.data;
        if (saved?._id) {
          // Replace optimistic entry with real ID
          setExperiences(prev => prev.map(exp =>
            exp.id === optimisticId ? { ...exp, id: saved._id } : exp
          ));
        }
        // BUG-FIX E1: read real XP amount from server response
        if (saved?.xpAwarded) setXpAwarded(saved.xpAwarded);
        // BUG-FIX E1: update navbar XP badge immediately + sync shared experiences cache
        await globalMutate('/api/user/me');
        await globalMutate('/api/experiences');
      }
    } catch {
      // Keep optimistic entry even on network failure
    }
  };

  // Filter & Sort Logic
  const filteredExperiences = experiences
    .filter((exp) => {
      if (filterDifficulty !== "All" && exp.difficulty !== filterDifficulty) return false;
      if (filterCompany !== "All" && exp.company !== filterCompany) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.id === expandedId) return -1;
      if (b.id === expandedId) return 1;
      if (sortBy === "Most Upvoted") {
        return b.upvotes - a.upvotes;
      }
      // FIX: ids are strings ("b.id - a.id" was always NaN). Sort newest-first
      // using the raw createdAt captured during mapping.
      return (new Date(b.createdAt ?? 0).getTime() || 0) - (new Date(a.createdAt ?? 0).getTime() || 0);
    });

  return (
    <>
      {/* Main page content */}
      <div className="space-y-10 relative max-w-[1200px] mx-auto">
        {/* Toast Feedback Notification */}
        {showToast && (
          <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 border border-gray-800 text-sm transition-opacity duration-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Hero section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-[32px] leading-tight font-extrabold text-gray-900">
              Ace your interview with <span className="text-blue-600">Interview Experience</span>
            </h2>
            <p className="text-gray-500 text-lg mt-2 font-normal">Turn your placement story into someone&apos;s prep guide.</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setFormSubmitted(false); }}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all self-start flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4" /> Share Yours
          </button>
        </div>

        {/* Popular Companies Grid */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Popular Companies
            </h3>
            <Link
              href="/companies"
              className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-semibold transition-colors"
            >
              View all <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularCompanies.map((c) => (
              <div
                key={c.name}
                onClick={() => setFilterCompany(c.name)}
                className={`bg-white border p-4 rounded-xl flex flex-col items-center text-center group cursor-pointer transition-all hover:-translate-y-0.5 ${
                  filterCompany === c.name
                    ? "border-blue-600 ring-2 ring-blue-500/20 shadow-md"
                    : "border-gray-200 hover:shadow-md"
                }`}
              >
                <div className="mb-3">
                  <CompanyLogo name={c.name} size={44} />
                </div>
                <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                <span className="text-[9px] uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-2 font-bold shrink-0">
                  {c.type}
                </span>
                <p className="text-[11px] text-gray-500 mt-2 font-medium">{c.count} Experiences</p>

                {/* View Intel details */}
                <Link
                  href={`/companies/${c.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-3 text-[10px] font-semibold text-blue-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50:bg-slate-800/60 hover:border-gray-300 transition-all inline-flex items-center shadow-sm"
                >
                  View Intel →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Experience Feed list */}
        <section>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">Experiences Feed</h3>
              {/* Active Company Filter indicator */}
              {filterCompany !== "All" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Company: {filterCompany}
                  <button onClick={() => setFilterCompany("All")} className="focus:outline-none">
                    <X className="w-3 h-3 hover:text-blue-900" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter by Difficulty */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Filter by Company */}
              <div className="flex items-center gap-2">
                <select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Companies</option>
                  {/* BUG-EX2 FIX: Company names from DB (not hardcoded 15) */}
                  {[...new Set(experiences.map(e => e.company))].filter(Boolean).sort().map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Sort by */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Most Upvoted">Most Upvoted</option>
                  <option value="Newest">Newest</option>
                </select>
              </div>
            </div>
          </div>

          {/* LOADING FIX: loadingExp was tracked but never rendered — the feed
              flashed "No experiences match your filters" on every visit. */}
          {loadingExp ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-1/4 bg-gray-100 rounded" />
                      <div className="h-2.5 w-1/3 bg-gray-50 rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-gray-50 rounded" />
                  <div className="h-3 w-5/6 bg-gray-50 rounded mt-2" />
                </div>
              ))}
            </div>
          ) : filteredExperiences.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
              <p className="text-gray-500 font-medium mb-2">No experiences match your filters.</p>
              <button
                onClick={() => {
                  setFilterCompany("All");
                  setFilterDifficulty("All");
                }}
                className="mt-3 px-4 py-2 bg-white text-blue-600 border border-gray-200 rounded-full hover:bg-gray-50:bg-slate-800/60 font-semibold text-sm transition-all shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExperiences.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 relative group hover:shadow-md transition-shadow cursor-default"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4">
                    <div className="flex gap-4">
                      <div className="shrink-0">
                        <CompanyLogo name={exp.company} size={44} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base flex flex-wrap items-center gap-1.5">
                          {exp.company}
                          <span className="font-normal text-gray-300">|</span>
                          <span className="text-gray-800 text-sm font-medium">{exp.role}</span>
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-500 font-medium">
                          <div className="flex items-center gap-1">
                            <History className="w-3.5 h-3.5 text-gray-400" />
                            {exp.roundsCount} Rounds
                          </div>
                          <div className="flex items-center gap-1">
                            <Code className="w-3.5 h-3.5 text-gray-400" />
                            {exp.problemsCount} Problems
                          </div>
                          <span className="text-green-600 font-bold ml-1">Selected</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Like/Upvote Button — only action kept per product spec */}
                      <button
                        onClick={() => handleUpvote(exp.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                          exp.hasUpvoted
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50:bg-slate-800/60"
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${exp.hasUpvoted ? "fill-blue-600 animate-pulse" : ""}`} />
                        {exp.upvotes}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                      exp.difficulty === 'Easy' ? 'bg-green-50 text-green-700 border border-green-200' :
                      exp.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {exp.difficulty}
                    </span>
                    <span className="px-2.5 py-0.5 bg-gray-50 text-gray-600 text-[11px] font-semibold rounded-full border border-gray-100">
                      {exp.workType}
                    </span>
                    <span className="px-2.5 py-0.5 bg-gray-50 text-gray-600 text-[11px] font-semibold rounded-full border border-gray-100">
                      0-1 years
                    </span>
                  </div>

                  <div className="mt-5 border-l-4 border-blue-500 pl-4 bg-blue-50/30 py-3 pr-3 rounded-r-lg">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Experience Highlights</h5>
                    <p className="text-sm text-gray-700 leading-relaxed font-normal">
                      {exp.experience}
                    </p>
                  </div>

                  {/* Inline Accordion for Detailed Rounds */}
                  {expandedId === exp.id && (
                    <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-2">Round Details</h5>
                      <div className="space-y-3">
                        {exp.rounds.map((round) => (
                          <div key={round.roundNumber} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  Round {round.roundNumber}
                                </span>
                                <span className="text-xs font-bold text-gray-800">{round.type}</span>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${round.cleared ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {round.cleared ? 'Cleared' : 'Not Cleared'}
                              </span>
                            </div>
                            {round.topics && round.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {round.topics.map((t) => (
                                  <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-600 leading-relaxed">{round.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800">-{exp.author}</span>
                      <span>{exp.authorRole}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                        className="px-4 py-2 bg-white text-blue-600 border border-gray-200 rounded-full hover:bg-gray-50:bg-slate-800/60 hover:border-gray-300 font-semibold inline-flex items-center gap-1.5 transition-all text-xs shadow-sm"
                      >
                        {expandedId === exp.id ? "Hide Details" : "View Details"}
                        {expandedId === exp.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <span>Posted on: {exp.postedAgo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Submit Experience MODAL ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-10 pb-6 px-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 id="modal-title" className="text-xl font-bold text-gray-900">Share Your Interview Experience</h2>
                <p className="text-sm text-gray-500 mt-0.5">Help your juniors prepare better. Every submission makes PlacePrep smarter.</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100:bg-slate-800 text-gray-400 hover:text-gray-700 transition-colors ml-4 shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-7 py-5 overflow-y-auto max-h-[calc(100vh-220px)]">
              {formSubmitted ? (
                /* Success State */
                <div className="text-center py-10">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank you for contributing!</h3>
                  <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-6 py-3 text-amber-800 font-bold text-lg mt-4 mb-4 shadow-sm">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                    +{xpAwarded ?? 50} XP Earned! {/* BUG-FIX E1: was hardcoded 50 */}
                  </div>
                  <p className="text-gray-500 text-sm">Your experience will help future NST students prepare better.</p>
                  <div className="flex justify-center gap-3 mt-8">
                    <button
                      onClick={closeModal}
                      className="border border-gray-300 text-gray-700 text-sm px-5 py-2.5 rounded-lg hover:bg-gray-50:bg-slate-800/60 transition-colors font-medium"
                    >
                      Back to Feed
                    </button>
                    <button
                      onClick={() => {
                        setFormSubmitted(false);
                        clearForm();
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-lg transition-colors font-medium"
                    >
                      Submit Another
                    </button>
                  </div>
                </div>
              ) : (
                /* Form */
                <>
                  {/* XP Banner */}
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 shadow-sm">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                    <span className="text-amber-800 font-medium text-sm">Earn 50 XP for submitting your interview experience this week!</span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Company</label>
                        <input
                          type="text"
                          value={formCompanyQuery}
                          onChange={(e) => handleCompanyQueryChange(e.target.value)}
                          onBlur={() => setTimeout(() => setFormCompanyOpen(false), 150)}
                          onFocus={() => formCompanyQuery && setFormCompanyOpen(formCompanySuggestions.length > 0)}
                          placeholder="Type company name…"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formCompanyOpen && formCompanySuggestions.length > 0 && (
                          <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                            {formCompanySuggestions.map((s) => (
                              <li
                                key={s}
                                onMouseDown={() => selectCompanySuggestion(s)}
                                className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                              >
                                {s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Role / Level</label>
                        <select
                          value={formRole}
                          onChange={(e) => setFormRole(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="SDE-1">SDE-1</option>
                          <option value="SDE-2">SDE-2</option>
                          <option value="Data Analyst">Data Analyst</option>
                          <option value="Frontend Engineer">Frontend Engineer</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Interview Date</label>
                        <input
                          type="date"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Outcome</label>
                        <div className="flex gap-2">
                          {[
                            { key: "offer", label: "Offer", icon: CheckCircle, activeClass: "bg-green-600 text-white border-green-600" },
                            { key: "rejected", label: "Rejected", icon: XCircle, activeClass: "bg-red-600 text-white border-red-600" },
                            { key: "waiting", label: "Waiting", icon: Clock, activeClass: "bg-amber-500 text-white border-amber-500" },
                          ].map(({ key, label, icon: Icon, activeClass }) => (
                            <button
                              type="button"
                              key={key}
                              onClick={() => setFormOutcome(key)}
                              className={`flex-1 text-xs font-medium py-2.5 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${ formOutcome === key ? activeClass : "border-gray-200 text-gray-700 hover:bg-gray-50:bg-slate-800/60"}`}
                            >
                              <Icon className="w-3.5 h-3.5" />{label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stars */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Overall Difficulty</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setFormStars(s)}
                            className={`p-1 ${s <= formStars ? "text-blue-500" : "text-gray-200"} hover:text-blue-500 transition-colors`}
                          >
                            <Star className="w-6 h-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rounds Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Rounds Conducted</label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={formRoundsCount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setFormRoundsCount("");
                              return;
                            }
                            const n = Number(val);
                            setFormRoundsCount(n);
                            // Expand formRoundDetails if needed
                            setFormRoundDetails((prev) => {
                              const copy = [...prev];
                              while (copy.length < n) copy.push({ type: "DSA Coding", topics: "", description: "", cleared: true });
                              return copy;
                            });
                          }}
                          onBlur={() => {
                            if (formRoundsCount === "" || formRoundsCount < 1) setFormRoundsCount(1);
                            else if (formRoundsCount > 8) setFormRoundsCount(8);
                          }}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Problems Asked</label>
                        <input
                          type="number"
                          min={0}
                          value={formProblemsCount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormProblemsCount(val === "" ? "" : Number(val));
                          }}
                          onBlur={() => {
                            if (formProblemsCount === "" || formProblemsCount < 0) setFormProblemsCount(0);
                          }}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Per-Round Breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-700">Round-wise Experience</span>
                      </div>
                      {Array.from({ length: typeof formRoundsCount === 'number' ? formRoundsCount : 0 }, (_, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Round {i + 1}</span>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500">Cleared?</label>
                              <button
                                type="button"
                                onClick={() => setFormRoundDetails((prev) => {
                                  const copy = [...prev];
                                  copy[i] = { ...copy[i], cleared: !copy[i].cleared };
                                  return copy;
                                })}
                                className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                                  formRoundDetails[i]?.cleared
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-red-50 text-red-600 border-red-200"
                                }`}
                              >
                                {formRoundDetails[i]?.cleared ? "Yes" : "No"}
                              </button>
                            </div>
                          </div>
                          <select
                            value={formRoundDetails[i]?.type ?? "DSA Coding"}
                            onChange={(e) => setFormRoundDetails((prev) => {
                              const copy = [...prev];
                              copy[i] = { ...copy[i], type: e.target.value };
                              return copy;
                            })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Online Assessment">Online Assessment</option>
                            <option value="DSA Coding">DSA Coding</option>
                            <option value="System Design">System Design</option>
                            <option value="LLD">Low Level Design</option>
                            <option value="HR">HR / Behavioral</option>
                            <option value="Managerial">Managerial</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Topics (comma separated, e.g. Arrays, DP)"
                            value={formRoundDetails[i]?.topics ?? ""}
                            onChange={(e) => setFormRoundDetails((prev) => {
                              const copy = [...prev];
                              copy[i] = { ...copy[i], topics: e.target.value };
                              return copy;
                            })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <textarea
                            rows={2}
                            placeholder={`Describe Round ${i + 1} experience…`}
                            value={formRoundDetails[i]?.description ?? ""}
                            onChange={(e) => setFormRoundDetails((prev) => {
                              const copy = [...prev];
                              copy[i] = { ...copy[i], description: e.target.value };
                              return copy;
                            })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Experience Description */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Interview Experience</label>
                      <textarea
                        rows={4}
                        required
                        value={formExperienceText}
                        onChange={(e) => setFormExperienceText(e.target.value)}
                        placeholder="What questions were asked? How did you approach them? What was the difficulty level?"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Tips */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Any surprises or tips?</label>
                      <textarea
                        rows={3}
                        value={formTipsText}
                        onChange={(e) => setFormTipsText(e.target.value)}
                        placeholder="What wasn't covered in any prep guide? What surprised you?"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Submit Experience
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SubmitPageInner() {
  usePageTitle("Interview Experiences");
  return (
    <Suspense fallback={
      <div className="space-y-4 max-w-[1200px] mx-auto py-12">
        <div className="h-10 bg-gray-100 rounded-lg w-64 animate-pulse mb-6" />
        <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    }>
      <SubmitContent />
    </Suspense>
  );
}

// Admin feature-toggle gate (Feature Controls → student.experience)
export default function SubmitPageGate() {
  return (
    <FeatureGate feature="student.experience" title="Interview Experiences">
      <SubmitPageInner  />
    </FeatureGate>
  );
}
