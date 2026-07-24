"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, Shield, UserCheck, Globe2, BookOpen, KeyRound } from "lucide-react";

export type PortalRole = "student" | "faculty" | "admin";

interface UnifiedLoginFormProps {
  defaultRole?: PortalRole;
}

const CREDENTIALS = {
  student: { email: "student@newtonschool.co", pass: "student123" },
  faculty: { email: "faculty@newtonschool.co", pass: "faculty123" },
  admin: { email: "admin@newtonschool.co", pass: "admin123" },
};

const getPortalTargetUrl = (role: PortalRole, path: string): string => {
  if (typeof window === "undefined") return path;
  const host = window.location.hostname;
  const currentPort = window.location.port;

  // Local development port routing
  if (host === "localhost" || host === "127.0.0.1") {
    if (role === "student" && currentPort !== "3000") return `http://${host}:3000${path}`;
    if (role === "faculty" && currentPort !== "3001") return `http://${host}:3001${path}`;
    if (role === "admin" && currentPort !== "3002") return `http://${host}:3002${path}`;
  }
  return path;
};

const checkStudentOnboarded = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const sessionOnboarded = sessionStorage.getItem("has_onboarded") === "true";
    const cookieOnboarded = document.cookie.split("; ").some((c) => c.startsWith("has_onboarded=true"));
    return sessionOnboarded || cookieOnboarded;
  } catch {
    return false;
  }
};

export default function UnifiedLoginForm({ defaultRole = "student" }: UnifiedLoginFormProps) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<PortalRole>(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync inputs with selected role defaults for effortless testing
  useEffect(() => {
    const cred = CREDENTIALS[activeRole];
    setEmail(cred.email);
    setPassword(cred.pass);
    setError("");
  }, [activeRole]);

  const handleRoleSelect = (role: PortalRole) => {
    setActiveRole(role);
  };

  const handleQuickFill = (role: PortalRole) => {
    setActiveRole(role);
    const cred = CREDENTIALS[role];
    setEmail(cred.email);
    setPassword(cred.pass);
  };

  const performRedirect = (role: PortalRole) => {
    if (role === "student") {
      document.cookie = "student_authed=true; path=/; max-age=31536000";
      const isOnboarded = checkStudentOnboarded();
      const targetPath = isOnboarded ? "/dashboard" : "/onboarding/step1";
      const targetUrl = getPortalTargetUrl("student", targetPath);
      if (targetUrl.startsWith("http")) {
        window.location.href = targetUrl;
      } else {
        router.push(targetPath);
      }
    } else if (role === "faculty") {
      document.cookie = "faculty_authed=true; path=/; max-age=31536000";
      const targetUrl = getPortalTargetUrl("faculty", "/");
      if (targetUrl.startsWith("http")) {
        window.location.href = targetUrl;
      } else {
        router.push("/");
      }
    } else if (role === "admin") {
      document.cookie = "admin_authed=true; path=/; max-age=31536000";
      const targetUrl = getPortalTargetUrl("admin", "/overview");
      if (targetUrl.startsWith("http")) {
        window.location.href = targetUrl;
      } else {
        router.push("/overview");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate backend verification
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (email && password) {
      performRedirect(activeRole);
    } else {
      setError(`Please enter valid credentials for ${activeRole.toUpperCase()} portal.`);
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    performRedirect(activeRole);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-['Inter']">
      {/* Left panel — Dynamic brand info based on active role */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-12 text-white">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-white/20 rounded px-2.5 py-1 font-bold text-sm tracking-wide">NST</div>
            <span className="font-bold text-base tracking-tight">PlacePrep Unified Portal</span>
          </div>

          {activeRole === "student" && (
            <div className="animate-fadeIn">
              <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs px-3 py-1 rounded-full mb-6 font-semibold">
                <BookOpen className="w-3.5 h-3.5" /> Student Interview Intelligence
              </span>
              <h1 className="text-4xl font-extrabold leading-tight mb-4">
                Master Technical &<br />Behavioral Rounds
              </h1>
              <p className="text-blue-100/80 text-base leading-relaxed max-w-md">
                Built exclusively for NST students. Practice company-tagged questions, follow customized 4–16 week roadmaps, and track performance.
              </p>
            </div>
          )}

          {activeRole === "faculty" && (
            <div className="animate-fadeIn">
              <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs px-3 py-1 rounded-full mb-6 font-semibold">
                <GraduationCap className="w-3.5 h-3.5" /> Faculty Curriculum Portal
              </span>
              <h1 className="text-4xl font-extrabold leading-tight mb-4">
                Curriculum Intelligence &<br />Student Mentorship
              </h1>
              <p className="text-blue-100/80 text-base leading-relaxed max-w-md">
                Identify industry vs syllabus curriculum gaps, monitor student preparation velocity, and resolve doubt queues in real time.
              </p>
            </div>
          )}

          {activeRole === "admin" && (
            <div className="animate-fadeIn">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs px-3 py-1 rounded-full mb-6 font-semibold">
                <Shield className="w-3.5 h-3.5" /> Admin Control Center
              </span>
              <h1 className="text-4xl font-extrabold leading-tight mb-4">
                PlacePrep Ecosystem<br />Management
              </h1>
              <p className="text-blue-100/80 text-base leading-relaxed max-w-md">
                Full administrative authority across student onboarding, faculty session monitoring, placement metrics, and platform security.
              </p>
            </div>
          )}
        </div>

        {/* Feature stats */}
        <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
          <div>
            <div className="text-2xl font-bold">658+</div>
            <div className="text-xs text-blue-200/70">Target Companies</div>
          </div>
          <div>
            <div className="text-2xl font-bold">18,000+</div>
            <div className="text-xs text-blue-200/70">Verified Questions</div>
          </div>
          <div>
            <div className="text-2xl font-bold">3 Portals</div>
            <div className="text-xs text-blue-200/70">Single Common Auth</div>
          </div>
        </div>
      </div>

      {/* Right panel — Unified Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 py-10">
        {/* Mobile Header */}
        <div className="flex items-center gap-2 mb-6 lg:hidden">
          <div className="bg-blue-700 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
          <span className="font-bold text-gray-900 text-base">PlacePrep Portal</span>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In to PlacePrep</h2>
            <p className="text-sm text-gray-500 mt-1">Select your role to access your dedicated portal</p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-gray-100 rounded-xl mb-6 border border-gray-200">
            <button
              type="button"
              onClick={() => handleRoleSelect("student")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === "student"
                  ? "bg-white text-blue-700 shadow-sm border border-gray-200/60"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Student
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("faculty")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === "faculty"
                  ? "bg-white text-indigo-700 shadow-sm border border-gray-200/60"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Faculty
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("admin")}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === "admin"
                  ? "bg-white text-slate-900 shadow-sm border border-gray-200/60"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Admin
            </button>
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="mb-6 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 mb-2">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              Quick Demo Accounts:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("student")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeRole === "student"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-100"
                }`}
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("faculty")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeRole === "faculty"
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                Faculty Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("admin")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeRole === "admin"
                    ? "bg-slate-800 text-white"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Admin Demo
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder={`${activeRole}@newtonschool.co`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-sm text-white transition-colors shadow-sm disabled:opacity-50 ${
                activeRole === "student"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : activeRole === "faculty"
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : activeRole === "student" ? (
                <BookOpen className="w-4 h-4" />
              ) : activeRole === "faculty" ? (
                <GraduationCap className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Student Google SSO */}
          {activeRole === "student" && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleGuestAccess}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Globe2 className="w-4 h-4 text-blue-500" />
                Sign in with Google (@newtonschool.co)
              </button>
            </div>
          )}
          <p className="text-xs text-center text-gray-400 mt-6 leading-relaxed">
            Authorized access for NST students, faculty, and administrators.
            <br />
            {activeRole === "student" && "First-time student sign-in will prompt 1-time onboarding."}
          </p>
        </div>
      </div>
    </div>
  );
}
