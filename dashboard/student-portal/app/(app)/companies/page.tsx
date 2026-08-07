"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, Plus, Check, XCircle } from "lucide-react";
import { companiesList, getUserRoadmapCompanies } from "@/lib/mock-data";
import AddToRoadmapModal from "@/components/modals/AddToRoadmapModal";
import CompanyLogo from "@/components/ui/CompanyLogo";

const FILTERS = ["All", "FAANG", "Indian Product", "Indian Startup", "Service"] as const;
type Filter = typeof FILTERS[number];

const filterMap: Record<Filter, string[]> = {
  "All":             [],
  "FAANG":           ["FAANG"],
  "Indian Product":  ["Indian Product"],
  "Indian Startup":  ["Indian Startup"],
  "Service":         ["Service"],
};

import { fetchCompanies } from "@/lib/api";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>(companiesList);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [roadmapSlugs, setRoadmapSlugs] = useState<string[]>([]);
  const [modalCompany, setModalCompany] = useState<any | null>(null);
  const [showLimitToast, setShowLimitToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live companies from Express backend on mount
  useEffect(() => {
    async function loadBackendCompanies() {
      try {
        const data = await fetchCompanies();
        if (data && data.length > 0) {
          // Normalize fields from backend (e.g. tier/category/type, questions/questionCount)
          const normalized = data.map((c: any) => ({
            name: c.name || "Company",
            slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, "") || "company",
            type: c.category || c.tier || c.type || "Product",
            questions: c.questionCount || c.questions || Math.floor(Math.random() * 500) + 100,
            topTopic: c.topTopic || (c.topTopics && c.topTopics[0]?.topic) || "DSA & System Design",
            tier: c.tier || "Product",
            ...c,
          }));
          setCompanies(normalized);
        }
      } catch (err) {
        console.warn("Failed to load live companies from backend:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBackendCompanies();
  }, []);

  // Read which companies are already in roadmap
  useEffect(() => {
    setTimeout(() => {
      const activeRoadmaps = getUserRoadmapCompanies();
      setRoadmapSlugs(activeRoadmaps.map((r) => r.slug));
    }, 0);
  }, []);

  const filtered = companies.filter((c) => {
    const cType = (c.type || c.tier || c.category || "").toLowerCase();
    const matchesFilter =
      activeFilter === "All" ||
      filterMap[activeFilter].some((f) => cType.includes(f.toLowerCase()) || (f === "FAANG" && cType.includes("maang")));
    const matchesSearch =
      !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleAdded = (slug: string) => {
    setRoadmapSlugs((prev) => [...prev.filter((s) => s !== slug), slug]);
  };

  const handleAddClick = (co: typeof companiesList[number], inRoadmap: boolean) => {
    if (inRoadmap) return;
    if (roadmapSlugs.length >= 5) {
      setShowLimitToast(true);
      setTimeout(() => setShowLimitToast(false), 3000);
      return;
    }
    setModalCompany(co);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Explore Companies</h1>
      <p className="text-sm text-gray-500 mb-6">
        View interview intel, round structure, and real questions. Add companies to your roadmap to track prep.
      </p>

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
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Company Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No companies found for &quot;{search}&quot;
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((co) => {
            const inRoadmap = roadmapSlugs.includes(co.slug);
            return (
              <div
                key={co.slug}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <CompanyLogo
                    logoUrl={co.logoUrl}
                    slug={co.slug}
                    name={co.name}
                    className="w-10 h-10 rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{co.name}</div>
                    <div className="text-xs text-gray-400">{co.type}</div>
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
                      {co.questions.toLocaleString()}
                    </span>{" "}
                    questions
                  </span>
                  <span>Top: {co.topTopic}</span>
                </div>

                {/* CTAs */}
                <div className="mt-auto flex gap-2">
                  {/* Add to Roadmap button */}
                  <button
                    onClick={() => handleAddClick(co, inRoadmap)}
                    disabled={inRoadmap}
                    className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border ${
                      inRoadmap
                        ? "border-green-200 bg-green-50 text-green-600 cursor-default"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {inRoadmap ? (
                      <><Check className="w-3 h-3" /> Added</>
                    ) : (
                      <><Plus className="w-3 h-3" /> Roadmap</>
                    )}
                  </button>

                  {/* View Intel */}
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
      )}

      {/* Summary */}
      <p className="text-xs text-gray-400 mt-6 text-center">
        Showing {filtered.length} of {companies.length} companies
      </p>

      {/* Add to Roadmap Modal */}
      {modalCompany && (
        <AddToRoadmapModal
          company={modalCompany}
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
