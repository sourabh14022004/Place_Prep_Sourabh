"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Shield, Trophy, BookOpen, Zap } from "lucide-react";

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Surface field-level validation details when present (e.g. "Please enter a valid email address")
        const fieldErrors = data.error?.details;
        const firstFieldError =
          fieldErrors &&
          Object.values(fieldErrors as Record<string, string[]>)
            .flat()
            .find(Boolean);
        setError(firstFieldError || data.error?.message || data.message || "Login failed. Please check your credentials.");
        return;
      }

      const { role, redirectUrl, token } = data.data;

      if (role === "student") {
        // Student cookie already set on this origin — go directly to dashboard
        window.location.href = `${redirectUrl}/dashboard`;
      } else {
        // Faculty/Admin: portals run on a different port/domain.
        // Cookies don't cross origins, so we pass the token via URL param.
        // The target portal's /auth/callback route sets the cookie and redirects.
        const callbackUrl = `${redirectUrl}/auth/callback?token=${encodeURIComponent(token)}&role=${role}`;
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Unable to connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0a0f1e]">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-14">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1f3e] via-[#0d1a3a] to-[#0a0f1e]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm tracking-wide">
              NST
            </div>
            <span className="font-bold text-white text-lg tracking-tight">PlacePrep</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Your Interview
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                Intelligence Hub
              </span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed max-w-xs">
              One login for everyone — students, faculty, and admins are
              automatically directed to their portal.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Trophy, label: "676 Companies", sub: "with verified interview data" },
              { icon: BookOpen, label: "5,500+ Questions", sub: "sorted by frequency & difficulty" },
              { icon: Zap, label: "463 Interactive MCQs", sub: "with instant checking & explanations" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{label}</div>
                  <div className="text-gray-500 text-xs">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-gray-600 text-xs">
            Newton School of Technology · B.Tech CS & AI
          </p>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="bg-blue-600 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm">NST</div>
          <span className="font-bold text-white text-lg">PlacePrep</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-blue-400 tracking-widest uppercase">
                Unified Portal Login
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1.5">Welcome back</h2>
            <p className="text-gray-500 text-sm">
              Sign in with your credentials — you&apos;ll be redirected to your portal automatically.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@newtonschool.co"
                required
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 pr-11 rounded-xl text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-center text-xs text-gray-600">
              Access restricted to NST members only.
              <br />
              Contact your admin if you cannot log in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
