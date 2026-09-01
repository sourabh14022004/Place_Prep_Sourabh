"use client";
import { FeatureGate } from "@/lib/use-features";

import { useState } from "react";
import { Building2, ArrowDownAZ, ArrowUpNarrowWide, ArrowDownWideNarrow, Search, Trophy } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type CompanyRanking = {
  _id?: string;
  name: string;
  slug: string;
  category?: string;
  alignmentScore?: number;
  topTestedSubject?: string;
  hiringStatus?: string;
};

type SortOption = "name_asc" | "name_desc" | "score_asc" | "score_desc";

function RankingsPageInner() {
  const [sortOption, setSortOption] = useState<SortOption>("score_desc");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useSWR('/api/faculty/rankings', fetcher);
  const rawCompanies: CompanyRanking[] = data?.data?.companies ?? data?.companies ?? [];

  const sortedCompanies = [...rawCompanies]
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortOption) {
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "score_asc": return (a.alignmentScore ?? 0) - (b.alignmentScore ?? 0);
        case "score_desc": return (b.alignmentScore ?? 0) - (a.alignmentScore ?? 0);
        default: return 0;
      }
    });

  // traffic-light: green ≥ 70, amber 40-69, red < 40
  const getScoreColor = (score: number) => {
    if (score < 40) return "bg-red-50 text-red-600 border-red-200";
    if (score <= 70) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-green-50 text-green-700 border-green-200";
  };

  const getScoreBar = (score: number) => {
    if (score < 40) return "bg-red-500";
    if (score <= 70) return "bg-amber-500";
    return "bg-green-500";
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "maang":   return <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">FAANG</span>;
      case "product": return <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Product</span>;
      case "service": return <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Service</span>;
      case "startup": return <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Startup</span>;
      default:        return <span className="text-[10px] bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">{category}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/25">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Company Rankings</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">See which companies test which subjects most heavily, ranked by curriculum relevance impact.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-14 bg-gray-100 animate-pulse rounded-xl" />
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-900 placeholder:text-gray-400 transition-shadow"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSortOption(sortOption === "name_asc" ? "name_desc" : "name_asc")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  sortOption.startsWith("name") ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                }`}
              >
                <ArrowDownAZ className="w-3.5 h-3.5" /> Name
              </button>
              <button
                onClick={() => setSortOption("score_desc")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  sortOption === "score_desc" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                }`}
              >
                <ArrowDownWideNarrow className="w-3.5 h-3.5" /> High Score
              </button>
              <button
                onClick={() => setSortOption("score_asc")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                  sortOption === "score_asc" ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                }`}
              >
                <ArrowUpNarrowWide className="w-3.5 h-3.5" /> Low Score
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-b-xl">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] uppercase tracking-wider font-bold text-gray-500 bg-gray-50/60">
                  <th className="py-3.5 px-6 w-12 text-center">#</th>
                  <th className="py-3.5 px-6 w-1/3">Company Name</th>
                  <th className="py-3.5 px-6">Top Tested Subject</th>
                  <th className="py-3.5 px-6 text-right">Alignment Score</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {sortedCompanies.length > 0 ? (
                  sortedCompanies.map((company, index) => (
                    <tr
                      key={company.slug}
                      className="hover:bg-blue-50/30 transition-colors bg-white"
                    >
                      {/* Rank */}
                      <td className="py-4 px-6 text-center">
                        {index < 3 ? (
                          <span className={`text-xs font-black ${index === 0 ? "text-amber-500" : index === 1 ? "text-gray-400" : "text-amber-700"}`}>
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 font-semibold">#{index + 1}</span>
                        )}
                      </td>
                      {/* Company */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 border border-blue-100 font-black text-sm shrink-0">
                            {company.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{company.name}</p>
                            <div className="mt-0.5">{getCategoryBadge(company.category ?? '')}</div>
                          </div>
                        </div>
                      </td>
                      {/* Subject */}
                      <td className="py-4 px-6">
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                          {company.topTestedSubject}
                        </span>
                      </td>
                      {/* Score */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full font-black text-xs border ${getScoreColor(company.alignmentScore ?? 0)}`}>
                            {company.alignmentScore ?? 0}%
                          </span>
                          <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getScoreBar(company.alignmentScore ?? 0)} transition-all`}
                              style={{ width: `${company.alignmentScore ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-14 text-center text-gray-400 text-sm font-medium">
                      No companies found matching &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// Admin feature-toggle gate (Feature Controls → faculty.rankings)
export default function RankingsPageGate() {
  return (
    <FeatureGate feature="faculty.rankings" title="Company Rankings">
      <RankingsPageInner />
    </FeatureGate>
  );
}
