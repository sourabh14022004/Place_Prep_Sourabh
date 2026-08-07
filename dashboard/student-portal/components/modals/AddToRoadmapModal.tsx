"use client";
import { useState, useEffect } from "react";
import { X, Calendar, CheckCircle } from "lucide-react";
import { type RoadmapCompanyEntry } from "@/lib/mock-data";
import CompanyLogo from "@/components/ui/CompanyLogo";

const WEEK_OPTIONS = [4, 8, 12, 16, 24];

interface Props {
  company: {
    slug: string;
    name: string;
    initial: string;
    color: string;
    type: string;
    logoUrl?: string;
  } | null;
  onClose: () => void;
  onAdded: (slug: string) => void;
}

export default function AddToRoadmapModal({ company, onClose, onAdded }: Props) {
  const [weeks, setWeeks] = useState(12);
  const [role, setRole] = useState("SDE-1");
  const [added, setAdded] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!company) return null;

  const handleAdd = () => {
    // Save to sessionStorage
    // BACKEND TODO: POST /api/user/me/roadmap/add
    try {
      const existing: RoadmapCompanyEntry[] = JSON.parse(
        sessionStorage.getItem("roadmap_companies") ?? "[]"
      );
      const already = existing.find((e) => e.slug === company.slug);
      if (!already) {
        existing.push({
          slug: company.slug,
          name: company.name,
          initial: company.initial,
          color: company.color,
          role,
          weeks,
          addedAt: new Date().toISOString(),
        });
        sessionStorage.setItem("roadmap_companies", JSON.stringify(existing));
      }
    } catch {
      // sessionStorage might be unavailable in some browsers
    }

    setAdded(true);
    setTimeout(() => {
      onAdded(company.slug);
      onClose();
    }, 1200);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {added ? (
            /* Success state */
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <div className="font-bold text-gray-900 text-lg">Added to Roadmap!</div>
              <div className="text-sm text-gray-500 mt-1">
                {company.name} — {weeks}-week plan for {role}
              </div>
            </div>
          ) : (
            <>
              {/* Company badge */}
              <div className="flex items-center gap-3 mb-5">
                <CompanyLogo
                  logoUrl={company.logoUrl}
                  slug={company.slug}
                  name={company.name}
                  className="w-12 h-12 rounded-xl"
                />
                <div>
                  <div className="font-bold text-gray-900 text-lg">{company.name}</div>
                  <div className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full inline-block mt-0.5">{company.type}</div>
                </div>
              </div>

              <h2 className="text-base font-bold text-gray-900 mb-1">Add to My Roadmap</h2>
              <p className="text-sm text-gray-500 mb-5">
                How many weeks do you want to commit to preparing for {company.name}?
              </p>

              {/* Role selector */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Target Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  {["SDE-1", "SDE-2", "Data Analyst", "Product Manager", "DevOps"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Week selector */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-600 mb-2 block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Commitment Period
                </label>
                <div className="flex gap-2 flex-wrap">
                  {WEEK_OPTIONS.map((w) => (
                    <button
                      key={w}
                      onClick={() => setWeeks(w)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        weeks === w
                          ? "bg-blue-700 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {w} weeks
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  That&apos;s ~{Math.round((weeks * 7) / 5)} working days · {Math.round(weeks * 5)} questions total
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleAdd}
                className="w-full bg-blue-700 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors"
              >
                Add {company.name} to My Roadmap →
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
