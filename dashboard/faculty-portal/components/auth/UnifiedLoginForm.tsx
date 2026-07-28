"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";

export type PortalRole = "student" | "faculty" | "admin";

interface UnifiedLoginFormProps {
  defaultRole?: PortalRole;
}

type AuthMode = "signin" | "signup" | "forgot";

const getPortalTargetUrl = (role: PortalRole, path: string): string => {
  if (typeof window === "undefined") return path;
  const host = window.location.hostname;
  const currentPort = window.location.port;

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

export default function UnifiedLoginForm({ defaultRole = "faculty" }: UnifiedLoginFormProps) {
  const router = useRouter();
  const clerk = useClerk();
  const { isLoaded: isUserLoaded, isSignedIn, user } = useUser();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [redirecting, setRedirecting] = useState(false);
  const [targetRole, setTargetRole] = useState<PortalRole>(defaultRole);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Sign up flow states
  const [signUpStep, setSignUpStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpCode, setSignUpCode] = useState("");

  const performRedirect = (role: PortalRole) => {
    setRedirecting(true);
    let targetPath = "/dashboard";
    if (role === "student") {
      document.cookie = "student_authed=true; path=/; max-age=31536000";
      const isOnboarded = checkStudentOnboarded();
      targetPath = isOnboarded ? "/dashboard" : "/onboarding/step1";
    } else if (role === "faculty") {
      document.cookie = "faculty_authed=true; path=/; max-age=31536000";
      targetPath = "/";
    } else if (role === "admin") {
      document.cookie = "admin_authed=true; path=/; max-age=31536000";
      targetPath = "/overview";
    }

    const targetUrl = getPortalTargetUrl(role, targetPath);
    window.location.href = targetUrl;
  };

  // Automatically detect user role from Clerk metadata / email and redirect
  useEffect(() => {
    if (isUserLoaded && isSignedIn && user) {
      const metadataRole = (user.publicMetadata?.role || user.unsafeMetadata?.role) as PortalRole | undefined;
      let detectedRole: PortalRole = defaultRole;

      if (metadataRole && ["student", "faculty", "admin"].includes(metadataRole)) {
        detectedRole = metadataRole;
      } else {
        const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
        if (email.includes("faculty")) {
          detectedRole = "faculty";
        } else if (email.includes("admin")) {
          detectedRole = "admin";
        } else {
          detectedRole = "student";
        }
      }

      setTargetRole(detectedRole);
      performRedirect(detectedRole);
    }
  }, [isUserLoaded, isSignedIn, user]);

  // Handle Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please enter both email/username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!clerk.client?.signIn) {
        setError("Authentication service is loading. Please try again.");
        return;
      }

      const result = await clerk.client.signIn.create({
        identifier,
        password,
      });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
      } else {
        setError("Additional authentication steps are required.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setError("");
    try {
      if (!clerk.client?.signIn) return;
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Failed to initiate Google sign-in.");
    }
  };

  // Handle Forgot Password - Step 1: Request reset code
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!clerk.client?.signIn) return;
      await clerk.client.signIn.create({
        strategy: "reset_password_email_code",
        identifier,
      });
      setForgotStep(2);
      setSuccessMessage("Verification code sent to your email!");
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password - Step 2: Confirm new password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode || !newPassword) {
      setError("Please enter the verification code and new password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!clerk.client?.signIn) return;
      const result = await clerk.client.signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: forgotCode,
        password: newPassword,
      });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
      } else {
        setError("Password reset incomplete. Please try again.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up - Step 1: Create Account
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !firstName) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!clerk.client?.signUp) return;
      await clerk.client.signUp.create({
        firstName,
        lastName,
        emailAddress: signUpEmail,
        password: signUpPassword,
      });

      await clerk.client.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setSignUpStep(2);
      setSuccessMessage("Verification code sent to your email!");
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up - Step 2: Verify Email Code
  const handleVerifySignUpCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpCode) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!clerk.client?.signUp) return;
      const result = await clerk.client.signUp.attemptEmailAddressVerification({ code: signUpCode });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
      } else {
        setError("Email verification failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  if (redirecting || (isUserLoaded && isSignedIn)) {
    return (
      <div className="min-h-screen bg-[#E5E9F8] flex items-center justify-center p-6 font-['Inter',sans-serif]">
        <div className="w-full max-w-md p-10 bg-white border border-white/60 rounded-[32px] shadow-2xl text-center">
          <Loader2 className="w-10 h-10 text-[#2C44B8] animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-extrabold text-gray-900">Authenticated!</h3>
          <p className="text-sm text-gray-500 mt-2">
            Routing to <span className="font-semibold text-[#2C44B8] capitalize">{targetRole} Portal</span>...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E5E9F8] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-['Inter',sans-serif]">
      {/* Main card matching reference design */}
      <div className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl shadow-indigo-100/70 border border-white p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row gap-8 lg:gap-12 items-center overflow-hidden">
        
        {/* Left Form Panel */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          
          {/* Newton School Brand Header */}
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <img src="/newton-school-logo.png" alt="Newton School Logo" className="w-8 h-8 object-contain shrink-0" />
              <div>
                <div className="flex items-baseline gap-1 font-bold text-gray-900 tracking-tight text-base leading-none">
                  <span className="font-extrabold text-[#111827]">Newton</span>
                  <span className="font-normal text-gray-500">School</span>
                </div>
                <span className="text-[9px] font-semibold text-gray-400 tracking-wider">OF TECHNOLOGY</span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 bg-[#EEF2FF] text-[#2C44B8] border border-[#C7D2FE] text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              NST PrePlace
            </span>
          </div>

          {mode === "signin" && (
            <>
              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-black text-[#2C44B8] tracking-tight mb-2">
                  Hello Again!
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 font-normal leading-relaxed">
                  Sign in to access your NST Placement Prep & Curriculum Portal.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3.5 mb-5 flex items-center gap-2 font-medium animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-[#F3F5FC] text-gray-800 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-sm outline-none border border-transparent focus:border-[#2C44B8] focus:bg-white transition-all font-medium"
                    required
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full bg-[#F3F5FC] text-gray-800 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-sm outline-none border border-transparent focus:border-[#2C44B8] focus:bg-white transition-all font-medium pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="text-xs font-semibold text-[#2C44B8] hover:underline cursor-pointer transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-2xl py-3.5 px-4 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-sm"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                {/* SIGN IN Pill Gradient Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#32D4E3] to-[#1CCAE5] text-white font-bold tracking-widest text-sm uppercase rounded-2xl py-4 hover:shadow-lg hover:shadow-cyan-200/60 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SIGN IN"}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 font-medium mt-6">
                No account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setSuccessMessage("");
                  }}
                  className="font-bold text-[#2C44B8] hover:underline cursor-pointer"
                >
                  Registered
                </button>
              </p>
            </>
          )}

          {/* Forgot Password Flow */}
          {mode === "forgot" && (
            <div className="animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setSuccessMessage("");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2C44B8] hover:underline mb-4 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>

              <h2 className="text-2xl font-black text-[#2C44B8] mb-2">Reset Password</h2>
              <p className="text-xs text-gray-400 mb-6">
                {forgotStep === 1
                  ? "Enter your email address and we'll send you a verification code."
                  : "Enter the code sent to your email and set your new password."}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3.5 mb-5 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl p-3.5 mb-5 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full bg-[#F3F5FC] text-gray-800 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-sm outline-none border border-transparent focus:border-[#2C44B8] focus:bg-white transition-all font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#32D4E3] to-[#1CCAE5] text-white font-bold tracking-widest text-sm uppercase rounded-2xl py-4 hover:shadow-lg hover:shadow-cyan-200/60 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SEND RESET CODE"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    placeholder="Enter 6-digit verification code"
                    className="w-full bg-[#F3F5FC] text-gray-800 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-sm outline-none border border-transparent focus:border-[#2C44B8] focus:bg-white transition-all font-medium"
                    required
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-[#F3F5FC] text-gray-800 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-sm outline-none border border-transparent focus:border-[#2C44B8] focus:bg-white transition-all font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#32D4E3] to-[#1CCAE5] text-white font-bold tracking-widest text-sm uppercase rounded-2xl py-4 hover:shadow-lg hover:shadow-cyan-200/60 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "UPDATE PASSWORD"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Register / Sign Up Flow */}
          {mode === "signup" && (
            <div className="animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setSuccessMessage("");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2C44B8] hover:underline mb-4 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>

              <h2 className="text-2xl font-black text-[#2C44B8] mb-2">Create Account</h2>
              <p className="text-xs text-gray-400 mb-6">
                {signUpStep === 1 ? "Register to access NST PlacePrep" : "Enter verification code sent to your email"}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3.5 mb-5 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl p-3.5 mb-5 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {signUpStep === 1 ? (
                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full bg-[#F3F5FC] text-gray-800 placeholder:text-gray-400 rounded-2xl px-4 py-3.5 text-sm outline-none border border-transparent focus:border-[#2C44B8] focus:bg-white transition-all font-medium"
                      required
                    />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full bg-[#F3F5FC] text-gray-800 placeholder:text-gray-400 rounded-2xl px-4 py-3.5 text-sm outline-none border border-transparent focus:border-[#2C44B8] focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-[#F3F5FC] text-gray-800 placeholder:text-gray-400 rounded-2xl px-5 py-3.5 text-sm outline-none border border-transparent focus:border-[#2C44B8] focus:bg-white transition-all font-medium"
                    required
                  />

                  <input
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Create Password"
                    className="w-full bg-[#F3F5FC] text-gray-800 placeholder:text-gray-400 rounded-2xl px-5 py-3.5 text-sm outline-none border border-transparent focus:border-[#2C44B8] focus:bg-white transition-all font-medium"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#32D4E3] to-[#1CCAE5] text-white font-bold tracking-widest text-sm uppercase rounded-2xl py-4 hover:shadow-lg hover:shadow-cyan-200/60 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CONTINUE"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifySignUpCode} className="space-y-4">
                  <input
                    type="text"
                    value={signUpCode}
                    onChange={(e) => setSignUpCode(e.target.value)}
                    placeholder="Enter email verification code"
                    className="w-full bg-[#F3F5FC] text-gray-800 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-sm outline-none border border-transparent focus:border-[#2C44B8] focus:bg-white transition-all font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#32D4E3] to-[#1CCAE5] text-white font-bold tracking-widest text-sm uppercase rounded-2xl py-4 hover:shadow-lg hover:shadow-cyan-200/60 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "VERIFY & REGISTER"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right 3D Illustration Panel matching reference image */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="relative w-full aspect-square max-w-[440px] rounded-[28px] overflow-hidden bg-gradient-to-br from-[#D2DCFC] via-[#BFCEFA] to-[#9EB4F6] p-4 flex items-center justify-center shadow-inner group">
            {/* Floating NST PrePlace Badge */}
            <div className="absolute top-4 left-4 z-10 bg-white/85 backdrop-blur-md border border-white/60 shadow-sm rounded-full px-3.5 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-gray-800 tracking-wide">NST PrePlace</span>
            </div>

            <img
              src="/login-3d-bg.png"
              alt="NST PlacePrep 3D Workspace"
              className="w-full h-full object-contain rounded-2xl drop-shadow-md hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
