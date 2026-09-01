"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ShieldCheck, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type InviteMeta = {
  email: string;
  fullName: string;
  stream?: string;
  expiresAt: string;
};

type State = "loading" | "valid" | "invalid" | "submitting" | "success";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [state, setState] = useState<State>("loading");
  const [meta, setMeta] = useState<InviteMeta | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) return;
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setMeta(json.data);
          setState("valid");
        } else {
          setErrorMsg(json.error?.message ?? "Invalid or expired invite link.");
          setState("invalid");
        }
      })
      .catch(() => {
        setErrorMsg("Network error. Please try again.");
        setState("invalid");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setState("submitting");
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to set up account.");
      }

      setState("success");
      toast.success("Account created! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong.");
      setState("valid"); // go back to form
      toast.error(err.message ?? "Failed to create account.");
    }
  };

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="bg-blue-700 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
          <span className="font-bold text-gray-900">PlacePrep — Faculty Portal</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          {/* Loading */}
          {state === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-500">Verifying invite link...</p>
            </div>
          )}

          {/* Invalid */}
          {state === "invalid" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
              <h1 className="text-lg font-bold text-gray-900">Invite Invalid</h1>
              <p className="text-sm text-gray-500 max-w-xs">{errorMsg}</p>
              <p className="text-xs text-gray-400 mt-2">
                Contact your admin for a fresh invite link.
              </p>
            </div>
          )}

          {/* Success */}
          {state === "success" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <ShieldCheck className="w-10 h-10 text-green-500" />
              <h1 className="text-lg font-bold text-gray-900">Account Created</h1>
              <p className="text-sm text-gray-500">
                Welcome to PlacePrep, {meta?.fullName}! Redirecting to login...
              </p>
            </div>
          )}

          {/* Valid — show form */}
          {(state === "valid" || state === "submitting") && meta && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Set up your account</h1>
              <p className="text-sm text-gray-500 mb-5">
                You have been invited to PlacePrep as a faculty member. Set a password to activate your account.
              </p>

              {/* Pre-filled info */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-800">{meta.fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-800">{meta.email}</span>
                </div>
                {meta.stream && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stream</span>
                    <span className="font-medium text-gray-800">{meta.stream}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      className={inputCls + " pr-10"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Confirm password
                  </label>
                  <input
                    type={showPw ? "text" : "password"}
                    className={inputCls}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                {errorMsg && state === "valid" && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={state === "submitting"}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {state === "submitting" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                  ) : (
                    "Activate Account"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          NST PlacePrep · Faculty Portal · This link expires 7 days after issue.
        </p>
      </div>
    </div>
  );
}
