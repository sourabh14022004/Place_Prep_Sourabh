"use client";
import { FeatureGate } from "@/lib/use-features";
import { useState, useEffect } from "react";
import { 
  Search, ChevronDown, Trophy, Medal, GraduationCap, 
  BookOpen, MessageSquare, Activity, User, X, Clock, 
  CheckCircle2, ArrowUpDown, Brain, TrendingUp
} from "lucide-react";
import { getStudents, type StudentMatrixEntry } from "@/lib/api";

// Mock student progress data matching student portal's general values
interface StudentProgress {
  rank: number;
  initials: string;
  name: string;
  rollNumber: string;
  branch: string;
  year: string;
  xp: number;
  alignment: number; // curriculum alignment out of 100
  solved: number;
  easy: number;
  medium: number;
  hard: number;
  change: string; // rank movement standing indicator
  mentoredByMe: boolean; // whether this student is mentored by the active faculty
  lastActive: string; // last active session in portal
  subjectBreakdown: {
    dsa: number;
    sysdesign: number;
    webdev: number;
    dbms: number;
    cloud: number;
  };
  recentMocks: {
    topic: string;
    score: number;
    date: string;
  }[];
}

// Maps StudentMatrixEntry from API to the local StudentProgress shape
function mapStudent(s: StudentMatrixEntry, idx: number): StudentProgress {
  return {
    rank: idx + 1,
    initials: s.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    name: s.fullName,
    rollNumber: s.studentId,
    branch: s.branch,
    year: s.year,
    xp: s.xpTotal,
    alignment: Math.min(100, Math.round(s.totalSolved / 3)),
    solved: s.totalSolved,
    easy: Math.round(s.totalSolved * 0.5),
    medium: Math.round(s.totalSolved * 0.35),
    hard: Math.round(s.totalSolved * 0.15),
    change: s.rankChange !== undefined ? String(s.rankChange) : "—",
    mentoredByMe: false,
    lastActive: s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleDateString() : "Unknown",
    subjectBreakdown: s.subjectBreakdown || { dsa: 70, sysdesign: 50, webdev: 60, dbms: 65, cloud: 55 },
    recentMocks: s.recentMocks || [],
  };
}

function StudentMatrixPageInner() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [sortField, setSortField] = useState<"rank" | "xp" | "alignment" | "solved">("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [mentorshipScope, setMentorshipScope] = useState<"all" | "mentees">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStudents()
      .then(({ students: raw }) => {
        setStudents(raw.map(mapStudent));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, branchFilter, yearFilter, mentorshipScope]);

  const handleSort = (field: "rank" | "xp" | "alignment" | "solved") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to desc for score/XP sorting
    }
  };

  const scopedStudents = mentorshipScope === "all" 
    ? students 
    : students.filter((s) => s.mentoredByMe);

  // Filter & Sort logic
  const filteredStudents = scopedStudents
    .filter((s) => {
      const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBranch = branchFilter === "All" || s.branch === branchFilter;
      const matchYear = yearFilter === "All" || s.year === yearFilter;
      return matchQuery && matchBranch && matchYear;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortDirection === "asc") {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

  const overallAvgAlignment = scopedStudents.length > 0
    ? Math.round(scopedStudents.reduce((acc, s) => acc + s.alignment, 0) / scopedStudents.length)
    : 0;
  const totalXP = scopedStudents.reduce((acc, s) => acc + s.xp, 0);

  const totalStudents = filteredStudents.length;
  const totalPages = Math.ceil(totalStudents / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 relative animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Student Matrix</h1>
          <p className="text-sm text-gray-500">Monitor individual student standing, coding completions, and curriculum alignment statistics.</p>
        </div>
        
        {/* Mentorship Scope Switcher */}
        <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
          <button
            onClick={() => setMentorshipScope("all")}
            className={`px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${mentorshipScope === "all" ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            All Students
          </button>
          <button
            onClick={() => setMentorshipScope("mentees")}
            className={`px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${mentorshipScope === "mentees" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
          >
            My Mentees
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-100 animate-pulse rounded-xl"></div>
        </div>
      ) : (
        <>
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Evaluated</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{students.length} Students</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Avg Alignment Score</p>
                <p className="text-2xl font-bold text-emerald-600 mt-0.5">{overallAvgAlignment}%</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Combined Practice XP</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalXP.toLocaleString()} XP</p>
              </div>
            </div>
          </div>

          {/* Leaderboard Podium (Dynamic based on first 3 ranked students) */}
          {(() => {
            const top3 = scopedStudents.slice(0, 3);
            if (top3.length < 3) return null;
            return (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6 flex flex-col items-center">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-indigo-650" />
                  Top Standing Leaders
                </h3>
                <div className="flex items-end justify-center gap-4 sm:gap-12 w-full max-w-xl py-4">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center w-28 sm:w-36 group cursor-pointer" onClick={() => setSelectedStudent(top3[1])}>
                    <div className="relative mb-3 flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center font-bold text-blue-700 text-sm sm:text-base shadow-sm group-hover:scale-105 transition-transform">
                        {top3[1].initials}
                      </div>
                      <div className="absolute -top-3 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-white">2nd</div>
                    </div>
                    <div className="text-center mb-2">
                      <p className="text-[11px] font-bold text-gray-800 truncate max-w-[90px] sm:max-w-none">{top3[1].name}</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{top3[1].xp.toLocaleString()} XP</p>
                    </div>
                    <div className="w-full h-16 sm:h-20 bg-gradient-to-b from-blue-50/70 to-blue-100/30 border border-blue-150 rounded-t-lg shadow-sm flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-400" />
                      <span className="text-xl sm:text-2xl font-black text-blue-300/40">II</span>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center w-28 sm:w-36 group cursor-pointer -mt-6" onClick={() => setSelectedStudent(top3[0])}>
                    <div className="relative mb-3 flex flex-col items-center">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-700 text-base sm:text-lg shadow-md group-hover:scale-105 transition-transform">
                        {top3[0].initials}
                      </div>
                      <div className="absolute -top-3 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-white">1st</div>
                    </div>
                    <div className="text-center mb-2">
                      <p className="text-xs font-bold text-gray-900 truncate max-w-[90px] sm:max-w-none">{top3[0].name}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">{top3[0].xp.toLocaleString()} XP</p>
                    </div>
                    <div className="w-full h-24 sm:h-28 bg-gradient-to-b from-emerald-50/70 to-emerald-100/30 border border-emerald-150 rounded-t-lg shadow-md flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-emerald-400" />
                      <span className="text-2xl sm:text-3xl font-black text-emerald-300/40">I</span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center w-28 sm:w-36 group cursor-pointer" onClick={() => setSelectedStudent(top3[2])}>
                    <div className="relative mb-3 flex flex-col items-center">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-100 border-2 border-purple-400 flex items-center justify-center font-bold text-purple-700 text-sm sm:text-base shadow-sm group-hover:scale-105 transition-transform">
                        {top3[2].initials}
                      </div>
                      <div className="absolute -top-3 bg-purple-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-white">3rd</div>
                    </div>
                    <div className="text-center mb-2">
                      <p className="text-[11px] font-bold text-gray-800 truncate max-w-[90px] sm:max-w-none">{top3[2].name}</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{top3[2].xp.toLocaleString()} XP</p>
                    </div>
                    <div className="w-full h-12 sm:h-16 bg-gradient-to-b from-purple-50/70 to-purple-100/30 border border-purple-150 rounded-t-lg shadow-sm flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-purple-400" />
                      <span className="text-xl sm:text-2xl font-black text-purple-300/40">III</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Filtering Toolbar */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Search */}
              <div className="relative w-full md:max-w-sm shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-450"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto md:justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-semibold">Branch:</span>
                  <select 
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Branches</option>
                    <option value="CS">Computer Science</option>
                    <option value="CS-AI">CS & AI</option>
                    <option value="CS-DS">CS & Data Science</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-semibold">Cohort:</span>
                  <select 
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Cohorts</option>
                    <option value="2023-2027">2023-2027</option>
                    <option value="2024-2028">2024-2028</option>
                    <option value="2025-2029">2025-2029</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto rounded-b-xl">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500 bg-white">
                    <th className="py-4 px-6 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("rank")}>
                      <div className="flex items-center gap-1.5">Rank <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-4 px-6">Change</th>
                    <th className="py-4 px-6">Student Info</th>
                    <th className="py-4 px-6 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("xp")}>
                      <div className="flex items-center gap-1.5">XP Standing <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-4 px-6 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("solved")}>
                      <div className="flex items-center gap-1.5">Coding Solved <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-4 px-6">Last Active</th>
                    <th className="py-4 px-6 text-right">Diagnostic Matrix</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200 bg-white">
                  {paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student) => (
                      <tr key={student.rollNumber} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {student.rank <= 3 ? (
                              <Medal className={`w-5 h-5 shrink-0 ${student.rank === 1 ? "text-amber-500" : student.rank === 2 ? "text-slate-400" : "text-amber-700"}`} />
                            ) : (
                              <span className="text-gray-400 font-bold ml-1">#{student.rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold">
                          {(() => {
                            if (student.change.startsWith("↑")) {
                              return (
                                <span className="text-emerald-600 flex items-center gap-0.5 text-sm">
                                  ↑ {student.change.replace("↑", "").trim()}
                                </span>
                              );
                            }
                            if (student.change.startsWith("↓")) {
                              return (
                                <span className="text-rose-600 flex items-center gap-0.5 text-sm">
                                  ↓ {student.change.replace("↓", "").trim()}
                                </span>
                              );
                            }
                            return (
                              <span className="text-gray-400 flex items-center gap-0.5 text-sm">
                                — 0
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                              {student.initials}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm leading-snug">{student.name}</p>
                              <div className="flex gap-2 items-center text-[11px] text-gray-500 font-medium mt-0.5">
                                <span>{student.rollNumber}</span>
                                <span>•</span>
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-semibold">{student.branch}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-900 flex items-center gap-1">
                            <Brain className="w-3.5 h-3.5 text-indigo-500 fill-indigo-100" />
                            {student.xp.toLocaleString()} <span className="text-xs text-gray-400 font-normal">XP</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <span className="font-bold text-gray-900 text-sm">{student.solved} </span>
                            <span className="text-xs text-gray-400">problems</span>
                            <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold">
                              <span className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">{student.easy}E</span>
                              <span className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">{student.medium}M</span>
                              <span className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded">{student.hard}H</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-600 text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{student.lastActive}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-xs py-1.5 px-3 rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            View Diagnostic
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        No students found matching your query filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls footer */}
            {totalPages > 1 && (
              <div className="p-4 bg-gray-50/50 border-t border-gray-200 rounded-b-xl flex flex-col sm:flex-row gap-4 items-center justify-between text-xs text-gray-500 font-semibold shrink-0">
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 bg-white text-xs text-gray-700 outline-none cursor-pointer focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={5}>5 entries</option>
                    <option value={10}>10 entries</option>
                    <option value={25}>25 entries</option>
                    <option value={50}>50 entries</option>
                  </select>
                  <span>of {totalStudents} students</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-md transition-colors cursor-pointer font-bold ${
                          currentPage === pageNum
                            ? "bg-black text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Student Alignment Diagnostics Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedStudent.initials}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{selectedStudent.name}</h3>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">{selectedStudent.rollNumber} · {selectedStudent.branch} · {selectedStudent.year}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6">
              
              {/* Overall alignment and coding statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Solved</p>
                  <p className="text-lg font-black text-gray-900 mt-1">{selectedStudent.solved} / 400</p>
                  <div className="flex gap-1.5 items-center mt-2 flex-wrap">
                    <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-200/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {selectedStudent.easy} Easy
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-200/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      {selectedStudent.medium} Med
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-200/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      {selectedStudent.hard} Hard
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Standing Score</p>
                  <p className="text-lg font-black text-emerald-700 mt-1">{selectedStudent.alignment}% Aligned</p>
                  <div className="text-[10px] font-semibold text-gray-500 mt-2 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Ranked #{selectedStudent.rank} in Cohort {selectedStudent.year}
                  </div>
                </div>
              </div>

              {/* Subject Matrix Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Subject Level Performance
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "Data Structures & Algorithms", value: selectedStudent.subjectBreakdown.dsa, color: "bg-emerald-500/80", text: "text-emerald-700" },
                    { label: "System Design", value: selectedStudent.subjectBreakdown.sysdesign, color: "bg-rose-500/80", text: "text-rose-700" },
                    { label: "Web Development", value: selectedStudent.subjectBreakdown.webdev, color: "bg-blue-500/80", text: "text-blue-700" },
                    { label: "DBMS & SQL", value: selectedStudent.subjectBreakdown.dbms, color: "bg-indigo-500/85", text: "text-indigo-700" },
                    { label: "Cloud Computing", value: selectedStudent.subjectBreakdown.cloud, color: "bg-amber-500/80", text: "text-amber-700" }
                  ].map((sub) => (
                    <div key={sub.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-700">{sub.label}</span>
                        <span className={`text-[11px] ${sub.text}`}>{sub.value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100/70 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${sub.color}`} 
                          style={{ width: `${sub.value}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock Interviews Audit */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Mock Interview Feedback
                </h4>
                <div className="space-y-2.5">
                  {selectedStudent.recentMocks.map((mock, i) => (
                    <div key={i} className="flex justify-between items-center border border-gray-200/50 p-3 bg-gray-50/50 rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-xs font-bold text-gray-800">{mock.topic}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Completed {mock.date}</p>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 bg-white border border-gray-200 px-3 py-1 rounded-md shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {mock.score} / 5.0
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0 rounded-b-xl">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="bg-black text-white py-2 px-6 rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors cursor-pointer"
              >
                Close Diagnostic
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}


// Admin feature-toggle gate (Feature Controls → faculty.students)
export default function StudentMatrixPageGate() {
  return (
    <FeatureGate feature="faculty.students" title="Student Matrix">
      <StudentMatrixPageInner />
    </FeatureGate>
  );
}
