"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import { Eye, EyeOff, Loader2, Shield, Trophy, BookOpen, Zap, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            hd?: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const REQUIRED_DOMAIN = "@nst.rishihood.edu.in";

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showDevGoogleModal, setShowDevGoogleModal] = useState(false);
  const [devEmail, setDevEmail] = useState("");
  const [devName, setDevName] = useState("");

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = useCallback(async (credential: string) => {
    setError("");
    setSuccessMsg("");
    setGoogleLoading(true);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Google authentication failed. Please try again.");
        return;
      }

      setSuccessMsg("Signed in successfully! Redirecting...");
      const { redirectUrl } = data.data;
      window.location.href = redirectUrl || "/dashboard";
    } catch {
      setError("Unable to connect to authentication server. Please check your connection.");
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  // Initialize Google Identity Services when script is ready and Client ID is available
  const initGoogleAuth = useCallback(() => {
    if (!googleClientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response?.credential) {
            handleGoogleSuccess(response.credential);
          }
        },
        hd: "nst.rishihood.edu.in",
      });

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 320,
        });
      }
    } catch (err) {
      console.error("Failed to initialize Google Sign-In:", err);
    }
  }, [googleClientId, handleGoogleSuccess]);

  useEffect(() => {
    if (googleClientId && window.google?.accounts?.id) {
      initGoogleAuth();
    }
  }, [googleClientId, initGoogleAuth]);

  async function handleGoogleClick() {
    setError("");
    if (!googleClientId) {
      // If client ID is not configured yet in .env, offer quick setup & testing modal
      setShowDevGoogleModal(true);
      return;
    }

    if (window.google?.accounts?.id) {
      setGoogleLoading(true);
      window.google.accounts.id.prompt();
      setTimeout(() => setGoogleLoading(false), 2000);
    } else {
      setError("Google Sign-In is loading. Please try again in a few seconds.");
    }
  }

  async function handleDevGoogleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = devEmail.trim().toLowerCase();

    // Client-side quick check
    if (!cleanEmail.endsWith(REQUIRED_DOMAIN)) {
      setError(`Access denied: Email must end with ${REQUIRED_DOMAIN}`);
      return;
    }

    setError("");
    setGoogleLoading(true);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          devMode: true,
          email: cleanEmail,
          name: devName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Google login failed.");
        return;
      }

      setSuccessMsg("Signed in successfully! Redirecting...");
      setShowDevGoogleModal(false);
      window.location.href = data.data?.redirectUrl || "/dashboard";
    } catch {
      setError("Unable to authenticate. Please check server status.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
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
        const fieldErrors = data.error?.details;
        const firstFieldError =
          fieldErrors &&
          Object.values(fieldErrors as Record<string, string[]>)
            .flat()
            .find(Boolean);
        setError(firstFieldError || data.error?.message || data.message || "Login failed. Please check your credentials.");
        return;
      }

      const { redirectUrl } = data.data;
      window.location.href = redirectUrl;
    } catch {
      setError("Unable to connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleAuth}
      />

      <div className="min-h-screen flex bg-[#0a0f1e]">
        {/* ── Left brand panel ── */}
        <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-14">
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-blue-600 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm">NST</div>
            <span className="font-bold text-white text-lg">PlacePrep</span>
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-blue-400 tracking-widest uppercase">
                  NST Portal Login
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1.5">Welcome back</h2>
              <p className="text-gray-500 text-sm">
                Sign in with your NST Google account or email credentials.
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Success banner */}
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-6 flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ── Google Sign-In Section ── */}
            <div className="space-y-2 mb-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={googleLoading || loading}
                  className="relative w-full bg-[#121829] hover:bg-[#182038] border border-blue-500/30 hover:border-blue-400/50 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-blue-950/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Verifying NST Google account...</span>
                    </>
                  ) : (
                    <>
                      {/* Official Google multicolored icon */}
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span className="font-semibold tracking-wide">Continue with Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Hidden or rendered Google Identity Services container if active */}
              {googleClientId && (
                <div
                  ref={googleBtnRef}
                  className="flex justify-center mt-2 overflow-hidden max-h-0 opacity-0 pointer-events-none"
                  aria-hidden="true"
                />
              )}

              {/* Verified domain indicator */}
              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-blue-300/80">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Restricted to <span className="font-mono text-blue-200 font-medium">@nst.rishihood.edu.in</span> accounts</span>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0a0f1e] px-3 text-gray-500 font-medium tracking-wider">
                  Or login with credentials
                </span>
              </div>
            </div>

            {/* Traditional Email / Password Form */}
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
                  placeholder="you@nst.rishihood.edu.in"
                  required
                  disabled={loading || googleLoading}
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
                    disabled={loading || googleLoading}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 pr-11 rounded-xl text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading || !email || !password}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md shadow-blue-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In with Password"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-center text-xs text-gray-500 leading-relaxed">
                Newton School of Technology student or faculty?
                <br />
                Sign in with your official <span className="text-gray-400 font-mono">@nst.rishihood.edu.in</span> email.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Development / Setup Modal (Active when Client ID is pending) ── */}
      {showDevGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#11172a] border border-blue-500/30 rounded-2xl p-6 shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Google OAuth Setup & Test</h3>
                <p className="text-xs text-gray-400">Domain restricted to @nst.rishihood.edu.in</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
              To connect live Google one-click accounts, set <code className="text-blue-400 font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in <code className="text-gray-300 font-mono">dashboard/web/.env.local</code>.
              <br /><br />
              You can test the <strong>domain gating</strong> and <strong>automatic student profile creation</strong> right now:
            </p>

            <form onSubmit={handleDevGoogleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block mb-1">
                  NST Email Address
                </label>
                <input
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="sourabh.sarkar@nst.rishihood.edu.in"
                  required
                  className="w-full bg-black/40 border border-white/15 text-white placeholder-gray-600 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Must end with <code className="text-blue-300">@nst.rishihood.edu.in</code>. Other domains will be rejected.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block mb-1">
                  Student Name (Optional)
                </label>
                <input
                  type="text"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  placeholder="Sourabh Sarkar"
                  className="w-full bg-black/40 border border-white/15 text-white placeholder-gray-600 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDevGoogleModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/15 text-gray-300 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleLoading || !devEmail}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
