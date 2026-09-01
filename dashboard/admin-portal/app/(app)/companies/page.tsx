"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Building2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { useAdminCompanies, patchAdminCompany } from "@/lib/hooks";

const CATEGORY_LABELS: Record<string, string> = {
  maang:   "MAANG",
  product: "Product",
  service: "Service",
  startup: "Startup",
  bfsi:    "BFSI",
  other:   "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  maang:   "bg-blue-50 text-blue-700",
  product: "bg-indigo-50 text-indigo-700",
  service: "bg-violet-50 text-violet-700",
  startup: "bg-cyan-50 text-cyan-700",
  bfsi:    "bg-sky-50 text-sky-700",
  other:   "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<string, string> = {
  "Active Hiring": "bg-green-50 text-green-700",
  "Slow Hiring":   "bg-yellow-50 text-yellow-700",
  "Paused":        "bg-gray-100 text-gray-500",
};

interface EditState {
  slug:            string;
  name:            string;
  hiringStatus:    string;
  hiringNote:      string;
  avgSalaryLpa:    string;
  avgProcessWeeks: string;
}

const LIMIT = 20;

export default function CompaniesPage() {
  const [page, setPage]         = useState(1);
  const [category, setCategory] = useState("");
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving]       = useState(false);

  const { data, isLoading, mutate } = useAdminCompanies(page, LIMIT, category);
  const companies: any[] = data?.companies ?? [];
  const total: number    = data?.total ?? 0;
  const totalPages       = Math.ceil(total / LIMIT);

  const openEdit = (c: any) =>
    setEditState({
      slug:            c.slug,
      name:            c.name,
      hiringStatus:    c.hiringStatus ?? "Active Hiring",
      hiringNote:      c.hiringNote ?? "",
      avgSalaryLpa:    c.avgSalaryLpa ?? "",
      avgProcessWeeks: c.avgProcessWeeks ?? "",
    });

  const handleSave = async () => {
    if (!editState) return;
    setSaving(true);
    try {
      await patchAdminCompany(editState.slug, {
        hiringStatus:    editState.hiringStatus,
        hiringNote:      editState.hiringNote,
        avgSalaryLpa:    editState.avgSalaryLpa,
        avgProcessWeeks: editState.avgProcessWeeks,
      });
      await mutate();
      setEditState(null);
      toast.success("Company updated");
    } catch {
      toast.error("Failed to update company");
    } finally {
      setSaving(false);
    }
  };

  const paginationPages = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const half  = 3;
    let start   = Math.max(1, page - half);
    const end   = Math.min(totalPages, start + 6);
    if (end - start < 6) start = Math.max(1, end - 6);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} companies in database</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 bg-white"
        >
          <option value="">All Categories</option>
          <option value="maang">MAANG</option>
          <option value="product">Product</option>
          <option value="service">Service</option>
          <option value="startup">Startup</option>
          <option value="bfsi">BFSI</option>
          <option value="other">Other</option>
        </select>
        {category && (
          <button
            onClick={() => { setCategory(""); setPage(1); }}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
          <span className="text-sm font-semibold text-gray-500">{total} companies found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                {["Company", "Category", "Status", "Avg Salary", "Questions", ""].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    <td className="px-6 py-3"><div className="h-4 w-36 bg-gray-200 rounded" /></td>
                    <td className="px-6 py-3"><div className="h-5 w-16 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-3"><div className="h-5 w-20 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-3"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-3"><div className="h-4 w-8 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-3" />
                  </tr>
                ))
              ) : companies.length > 0 ? (
                companies.map((c: any) => (
                  <tr key={c.slug} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://www.google.com/s2/favicons?sz=32&domain=${c.slug}.com`}
                          alt={c.name}
                          className="w-7 h-7 rounded-md object-contain border border-gray-100 bg-white p-0.5"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${CATEGORY_COLORS[c.category] ?? "bg-gray-100 text-gray-600"}`}>
                        {CATEGORY_LABELS[c.category] ?? c.category}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[c.hiringStatus] ?? "bg-gray-100 text-gray-600"}`}>
                        {c.hiringStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-gray-700">
                        {c.avgSalaryLpa ? `${c.avgSalaryLpa} LPA` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-gray-700">{c.questionCount ?? 0}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-all bg-blue-50 px-3 py-1.5 rounded-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">No companies found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/40">
            <span className="text-sm text-gray-400 font-medium">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {paginationPages.map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                    page === p ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editState && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setEditState(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">
                Edit — {editState.name}
              </h2>
              <button
                onClick={() => setEditState(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Hiring Status</label>
              <select
                value={editState.hiringStatus}
                onChange={e => setEditState(s => s && { ...s, hiringStatus: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700"
              >
                <option>Active Hiring</option>
                <option>Slow Hiring</option>
                <option>Paused</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Avg Salary (LPA)</label>
              <input
                type="text"
                placeholder="e.g. 18-25"
                value={editState.avgSalaryLpa}
                onChange={e => setEditState(s => s && { ...s, avgSalaryLpa: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Avg Process Weeks</label>
              <input
                type="text"
                placeholder="e.g. 3-5"
                value={editState.avgProcessWeeks}
                onChange={e => setEditState(s => s && { ...s, avgProcessWeeks: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Hiring Note</label>
              <textarea
                rows={2}
                placeholder="Optional note about hiring…"
                value={editState.hiringNote}
                onChange={e => setEditState(s => s && { ...s, hiringNote: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditState(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
