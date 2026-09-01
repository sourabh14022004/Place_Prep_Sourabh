"use client";
import { CompanyLogo } from "@/components/ui";
import { FeatureGate } from "@/lib/features";
import { PageHeader } from "@/components/ui";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, Plus, Check, XCircle } from "lucide-react";
import { useCompanies, useRoadmap } from "@/lib/hooks";
import AddToRoadmapModal from "@/components/modals/AddToRoadmapModal";
import ErrorState from "@/components/ErrorState";
import { usePageTitle } from "@/lib/use-page-title";

// FIX: chips now cover EVERY category in the Company model enum
// (maang | product | service | startup | bfsi | other) — BFSI/Other companies
// were previously unreachable except through "All".
const FILTERS = ["All", "FAANG", "Product", "Service", "Startup", "BFSI", "Other"] as const;
type Filter = typeof FILTERS[number];

type Company = {
  _id?: string;
  slug: string;
  name: string;
  category?: string;
  type?: string;
  hiringStatus?: string;
  questionCount?: number;
  questions?: number;
  topTopic?: string;
};

function CompaniesPageInner() {
  usePageTitle("Company Intel");
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [modalCompany, setModalCompany] = useState<Company | null>(null);
  const [showLimitToast, setShowLimitToast] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100); // BUG-FIX B1: paginate 100 at a time

  // BUG-FIX B1: reset visible count whenever filter or search changes
  useEffect(() => { setVisibleCount(100); }, [activeFilter, search]);

  // Cleanup for the limit-toast timer (prevents setState-after-unmount)
  useEffect(() => {
    if (!showLimitToast) return;
    const t = setTimeout(() => setShowLimitToast(false), 3000);
    return () => clearTimeout(t);
  }, [showLimitToast]);

  // Real API data
  const { data: companiesData, isLoading, error, mutate } = useCompanies();
  const { data: roadmapData } = useRoadmap();

  // BUG-W3 FIX: fetcher unwraps .data, so companiesData is already the array
  const allCompanies: Company[] = Array.isArray(companiesData) ? companiesData : [];

  // BUG-W3 FIX: same for roadmapData — already a raw array from fetcher
  const roadmapSlugs: string[] = (Array.isArray(roadmapData) ? roadmapData : []).map(
    (r: any) => r.companySlug
  );


  // Category mapping from API → filter chips
  const categoryMatch = (co: Company): string[] => {
    const cat = (co.category ?? co.type ?? "").toLowerCase();
    if (cat === "maang" || cat.includes("faang")) return ["FAANG"];
    if (cat === "product") return ["Product"];
    if (cat === "startup") return ["Startup"];
    if (cat === "service") return ["Service"];
    if (cat === "bfsi") return ["BFSI"];
    if (cat === "other" || cat === "") return ["Other"];
    return [];
  };

  // Title-cased display label for the card subtitle ("bfsi" → "BFSI")
  const prettyCategory = (co: Company): string => {
    const raw = (co.category ?? co.type ?? "").toLowerCase();
    if (!raw) return "";
    if (raw === "maang" || raw === "faang") return "FAANG";
    if (raw === "bfsi") return "BFSI";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  const filtered = allCompanies.filter((c) => {
    const matchesFilter = activeFilter === "All" || categoryMatch(c).includes(activeFilter);
    const matchesSearch = !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAddClick = (co: Company, inRoadmap: boolean) => {
    if (inRoadmap) return;
    if (roadmapSlugs.length >= 5) {
      setShowLimitToast(true);
      return;
    }
    setModalCompany(co);
  };

  const handleAdded = () => {
    // SWR will revalidate roadmap automatically
  };

  return (
    <div>
      <PageHeader title="Explore Companies" subtitle="Interview intel, round structures and real questions for every target company. Add them to your roadmap to start tracking." />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a company..."
          className="w-full max-w-sm pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`text-sm font-medium px-4 py-1.5 rounded-full border transition-colors ${
              activeFilter === f
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50:bg-slate-800/60"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error state — a failed fetch previously fell through to the empty
          state below, telling the user "No companies available yet." */}
      {error && !isLoading && (
        <ErrorState error={error} title="Couldn't load companies" onRetry={() => mutate()} />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse h-40" />
          ))}
        </div>
      )}

      {/* Company Grid */}
      {!isLoading && !error && filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {search ? `No companies found for "${search}"` : "No companies available yet."}
        </div>
      ) : !isLoading && !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.slice(0, visibleCount).map((co) => { // BUG-FIX B1: render only up to visibleCount
            const inRoadmap = roadmapSlugs.includes(co.slug);
            return (
              <div
                key={co.slug}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
<CompanyLogo name={co.slug.toLowerCase()} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{co.name}</div>
                    <div className="text-xs text-gray-400">{prettyCategory(co)}</div>
                  </div>
                  {inRoadmap && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5 shrink-0">
                      In Roadmap
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span>
                    <span className="font-semibold text-gray-900">
                      {(co.questionCount ?? co.questions ?? 0).toLocaleString()}
                    </span>{" "}
                    questions
                  </span>
                  {co.topTopic && <span>Top: {co.topTopic}</span>}
                </div>

                {/* CTAs */}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => handleAddClick(co, inRoadmap)}
                    disabled={inRoadmap}
                    className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border ${
                      inRoadmap
                        ? "border-green-200 bg-green-50 text-green-600 cursor-default"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50:bg-slate-800/60"
                    }`}
                  >
                    {inRoadmap ? (
                      <><Check className="w-3 h-3" /> Added</>
                    ) : (
                      <><Plus className="w-3 h-3" /> Roadmap</>
                    )}
                  </button>

                  <Link
                    href={`/companies/${co.slug}`}
                    className="flex-1 text-center bg-gray-900 text-white text-xs font-semibold py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                  >
                    View Intel <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* BUG-FIX B1: Load more button + updated summary */}
      {!isLoading && visibleCount < filtered.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount(v => v + 100)}
            className="text-sm font-medium px-5 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50:bg-slate-800/60 transition-colors"
          >
            Load 100 more
          </button>
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} companies
      </p>

      {/* Add to Roadmap Modal */}
      {modalCompany && (
        <AddToRoadmapModal
          company={modalCompany as any}
          onClose={() => setModalCompany(null)}
          onAdded={handleAdded}
        />
      )}

      {/* Limit Reached Toast */}
      {showLimitToast && (
        <div className="fixed bottom-5 right-5 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 text-sm transition-opacity duration-300">
          <div className="bg-red-100 text-red-600 rounded-full p-1 shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
          <span className="font-semibold">Cannot add more than 5 roadmaps. It gets messy!</span>
        </div>
      )}
    </div>
  );
}

// Admin feature-toggle gate (Feature Controls → student.companies)
export default function CompaniesPageGate() {
  return (
    <FeatureGate feature="student.companies" title="Company Intel">
      <CompaniesPageInner  />
    </FeatureGate>
  );
}
