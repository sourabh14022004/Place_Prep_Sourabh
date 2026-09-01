"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X, UserPlus, Pencil, Trash2, ChevronLeft, ChevronRight, Users, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Avatar color palette — deterministic from name, matching the Students page.
const AVATAR_COLORS = [
  "from-blue-500 to-blue-700",
  "from-indigo-500 to-indigo-700",
  "from-violet-500 to-violet-700",
  "from-cyan-500 to-cyan-700",
  "from-sky-500 to-sky-700",
  "from-blue-600 to-indigo-600",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initialsOf(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * Doubt domains an admin can assign. Must stay in sync with DOUBT_DOMAINS in
 * backend/src/types/shared.types.ts — the PATCH endpoint rejects unknown values.
 */
const DOUBT_DOMAINS = [
  "DSA",
  "System Design",
  "LLD",
  "Web Development",
  "Aptitude",
  "HR",
  "General",
] as const;

type Faculty = {
  _id?: string;
  id?: string | number;
  fullName?: string;
  name?: string;
  initials?: string;
  subject?: string;
  stream?: string;
  email?: string;
  status?: string;
  acceptCount?: number;
  declineCount?: number;
  satisfactionAvg?: number;
  responseRate?: number;
  accepted?: number;
  declined?: number;
  satisfaction?: number;
  doubtDomains?: string[];
};

type DomainCoverage = {
  domain: string;
  facultyCount: number;
  faculty: { id: string; fullName: string }[];
};

export default function ManageFacultyPage() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Debounced like the Students page — the raw value fired a request per keystroke.
  useEffect(() => {
    const h = setTimeout(() => { setDebouncedSearch(searchInput); setCurrentPage(1); }, 400);
    return () => clearTimeout(h);
  }, [searchInput]);

  // SWR — real faculty data
  const { data, mutate, isLoading } = useSWR(
    `/api/admin/faculty?page=${currentPage}&limit=${itemsPerPage}&search=${debouncedSearch}`,
    fetcher
  );
  const faculty: Faculty[] = data?.data?.faculty ?? data?.faculty ?? [];
  const total: number = data?.data?.total ?? data?.total ?? 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  // Per-domain coverage, so the admin can see which domains have nobody assigned.
  const { data: coverageRes, mutate: mutateCoverage } = useSWR(
    "/api/admin/faculty/doubt-domains",
    fetcher
  );
  const coverage: DomainCoverage[] = coverageRes?.data ?? [];
  const uncoveredDomains = coverage.filter((c) => c.facultyCount === 0);
  const coveredCount = coverage.length - uncoveredDomains.length;

  // The API already handles pagination and search filtering.
  const paginated = faculty;

  // Modal states
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [removingFacultyId, setRemovingFacultyId] = useState<string | number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({ name: '', email: '', stream: '' });
  const [saving, setSaving] = useState(false);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingFaculty) return;
    setEditingFaculty({ ...editingFaculty, [e.target.name]: e.target.value });
  };

  const toggleDomain = (domain: string) => {
    if (!editingFaculty) return;
    const current = editingFaculty.doubtDomains ?? [];
    setEditingFaculty({
      ...editingFaculty,
      doubtDomains: current.includes(domain)
        ? current.filter((d) => d !== domain)
        : [...current, domain],
    });
  };

  const saveEdit = async () => {
    if (!editingFaculty) return;
    const id = editingFaculty._id ?? editingFaculty.id;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/faculty/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editingFaculty.fullName ?? editingFaculty.name,
          subject: editingFaculty.subject,
          stream: editingFaculty.stream,
          status: editingFaculty.status,
          doubtDomains: editingFaculty.doubtDomains ?? [],
        }),
      });
      if (!res.ok) {
        // Surface the server's validation message (e.g. unknown domain) rather
        // than a generic failure, so a rejected assignment is actionable.
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? 'Update failed');
      }
      toast.success('Faculty updated.');
      mutate();
      mutateCoverage();
      setEditingFaculty(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update faculty.');
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (removingFacultyId === null) return;
    try {
      const res = await fetch(`/api/admin/faculty/${removingFacultyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Faculty removed.');
      mutate();
      // Removing a faculty member can empty a domain — refresh coverage too,
      // otherwise the banner keeps showing them as assigned.
      mutateCoverage();
    } catch {
      toast.error('Could not remove faculty.');
    } finally {
      setRemovingFacultyId(null);
    }
  };

  const submitNewFaculty = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/faculty/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newFaculty.email, fullName: newFaculty.name, stream: newFaculty.stream }),
      });
      if (!res.ok) throw new Error('Invite failed');
      toast.success(`Invite sent to ${newFaculty.email}`);
      setNewFaculty({ name: '', email: '', stream: '' });
      setIsAddModalOpen(false);
      mutate();
    } catch {
      toast.error('Could not send invite.');
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-emerald-50 text-emerald-700",
      INACTIVE: "bg-red-50 text-red-700",
      "INVITE PENDING": "bg-amber-50 text-amber-700",
      PENDING: "bg-amber-50 text-amber-700",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  return (
    <>
      <div className="space-y-5">
        {/* Header — title, live summary, search and primary action on one line,
            matching the Students page so the two read as the same product. */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Faculty</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total} faculty · {coveredCount} of {coverage.length} domains covered
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, stream, or email…"
                className="pl-8 pr-3 py-2 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400 w-56"
              />
            </div>
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Faculty
            </button>
          </div>
        </div>

        {/* Doubt routing — the coverage pills carry real meaning (an uncovered
            domain silently falls back to notifying everyone), so they get a
            titled panel rather than floating loose above the list. */}
        {coverage.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/40">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm font-semibold text-gray-500 truncate">Doubt Routing Coverage</span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                  uncoveredDomains.length > 0
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {uncoveredDomains.length > 0 && <AlertTriangle className="w-3 h-3" />}
                {uncoveredDomains.length > 0 ? `${uncoveredDomains.length} uncovered` : "All covered"}
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {coverage.map((c) => (
                  <div
                    key={c.domain}
                    title={c.faculty.map((f) => f.fullName).join(", ") || "No faculty assigned"}
                    className={`rounded-lg border px-3 py-2.5 ${
                      c.facultyCount === 0
                        ? "bg-amber-50/60 border-amber-200"
                        : "bg-gray-50/60 border-gray-100"
                    }`}
                  >
                    <p
                      className={`text-2xl font-black leading-tight ${
                        c.facultyCount === 0 ? "text-amber-600" : "text-gray-900"
                      }`}
                    >
                      {c.facultyCount}
                    </p>
                    <p
                      className={`text-xs font-semibold truncate mt-0.5 ${
                        c.facultyCount === 0 ? "text-amber-700" : "text-gray-500"
                      }`}
                    >
                      {c.domain}
                    </p>
                  </div>
                ))}
              </div>
              {uncoveredDomains.length > 0 && (
                <p className="text-xs text-amber-700 mt-4 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                  <span>
                    No faculty assigned to{" "}
                    <span className="font-semibold">
                      {uncoveredDomains.map((d) => d.domain).join(", ")}
                    </span>
                    . Doubts in {uncoveredDomains.length === 1 ? "it" : "them"} are shown to
                    all faculty until you assign someone.
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Faculty table — a table rather than cards because doubt domains are
            now the point of this page, and they need to be scannable down a
            column instead of hidden one edit-modal at a time. */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
            <span className="text-sm font-semibold text-gray-500">
              {total} {total === 1 ? "faculty member" : "faculty members"} found
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[860px]">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  {["Faculty", "Stream", "Doubt Domains", "Status", ""].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Skeleton rows — matches columns: avatar | stream | domains | status | actions
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50 animate-pulse">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-32 bg-gray-200 rounded" />
                            <div className="h-3 w-40 bg-gray-100 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3"><div className="h-3.5 w-28 bg-gray-100 rounded" /></td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1.5">
                          <div className="h-5 w-14 bg-gray-100 rounded" />
                          <div className="h-5 w-20 bg-gray-100 rounded" />
                        </div>
                      </td>
                      <td className="px-6 py-3"><div className="h-5 w-20 bg-gray-100 rounded-full" /></td>
                      <td className="px-6 py-3" />
                    </tr>
                  ))
                ) : paginated.length > 0 ? paginated.map((f) => {
                  const name = f.fullName ?? f.name ?? "";
                  const domains = f.doubtDomains ?? [];
                  return (
                    <tr key={f._id ?? String(f.id)} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors group">
                      {/* Name + avatar */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(name)} text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-sm`}>
                            {f.initials || initialsOf(name) || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{name}</p>
                            <p className="text-xs text-gray-400 truncate">{f.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3">
                        <span className="text-sm text-gray-600">{f.stream || f.subject || "—"}</span>
                      </td>

                      {/* Doubt domains — the column that makes routing auditable at a glance. */}
                      <td className="px-6 py-3">
                        {domains.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                            {domains.map((d) => (
                              <span key={d} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                                {d}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingFaculty(f)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5 hover:bg-amber-100 transition-colors"
                          >
                            <AlertTriangle className="w-3 h-3" /> None assigned
                          </button>
                        )}
                      </td>

                      <td className="px-6 py-3">{statusBadge(f.status ?? "")}</td>

                      {/* Inline actions — a dropdown here would be clipped by the
                          table's overflow, and two buttons need no menu anyway. */}
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingFaculty(f)}
                            title="Edit faculty"
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRemovingFacultyId(f._id ?? f.id ?? null)}
                            title="Remove faculty"
                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-500">
                        {debouncedSearch ? "No faculty match your search." : "No faculty members yet."}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {debouncedSearch ? "Try a different name, stream, or email." : "Add a faculty member to get started."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-400 font-medium">Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                      currentPage === p ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Add Faculty Modal ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl relative">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Add Faculty</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input name="name" value={newFaculty.name} onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Prof. John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" value={newFaculty.email} onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="john@university.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream / Subject</label>
                <input name="stream" value={newFaculty.stream} onChange={(e) => setNewFaculty({ ...newFaculty, stream: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Computer Science" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={submitNewFaculty} disabled={!newFaculty.name || !newFaculty.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFaculty.email)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Faculty Modal ─── */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
          {/* Capped height + scroll: with 7 domain pills this modal can exceed a
              laptop viewport, which pushed the Save button off-screen. */}
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl relative flex flex-col max-h-full">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Edit Faculty</h2>
              <button onClick={() => setEditingFaculty(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto px-6 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="name" value={editingFaculty.name ?? editingFaculty.fullName ?? ""} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" value={editingFaculty.email ?? ""} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                <input name="stream" value={editingFaculty.stream || ""} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={editingFaculty.status} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="INVITE PENDING">Invite Pending</option>
                </select>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1">Doubt Domains</label>
                <p className="text-xs text-gray-500 mb-2.5">
                  Student doubts tagged with these domains go to this faculty member.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DOUBT_DOMAINS.map((domain) => {
                    const selected = (editingFaculty.doubtDomains ?? []).includes(domain);
                    return (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => toggleDomain(domain)}
                        aria-pressed={selected}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-colors ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {domain}
                      </button>
                    );
                  })}
                </div>
                {(editingFaculty.doubtDomains ?? []).length === 0 && (
                  <p className="text-xs text-amber-700 mt-2.5 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>No domains selected — this faculty member will not receive any doubts.</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-4 shrink-0">
              <button onClick={() => setEditingFaculty(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Remove Confirmation Modal ─── */}
      {removingFacultyId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Remove Faculty?</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              This action will remove <span className="font-semibold text-gray-800">{faculty.find(f => (f._id ?? f.id) === removingFacultyId)?.fullName ?? faculty.find(f => (f._id ?? f.id) === removingFacultyId)?.name ?? 'the selected faculty member'}</span> from the faculty list. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemovingFacultyId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={confirmRemove} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
