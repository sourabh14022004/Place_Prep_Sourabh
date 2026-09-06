"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, CheckCircle, Zap, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Stepper from "@/components/onboarding/Stepper";
import { submitOnboarding } from "@/lib/hooks";

const readyItems = [
  "Custom roadmap based on your timeline and goals",
  "Daily practice plan tailored to your topic ratings",
  "Company-tagged questions from your target categories",
  "XP milestones and bi-weekly progress check-ins",
];

export default function Step4() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleLaunch = async () => {
    setSubmitting(true);
    try {
      // Read data collected across steps from sessionStorage.
      // GUARD FIX: deep-linking to /step4 (or expired storage) used to submit a
      // FABRICATED profile (SDE domain, product category, Google+Amazon). Any
      // missing step now sends the user back to that step instead.
      const rawDomains = sessionStorage.getItem("onboarding_domains");
      const rawCategories = sessionStorage.getItem("onboarding_categories");
      const rawCompanies = sessionStorage.getItem("onboarding_companies");
      const rawRatings = sessionStorage.getItem("onboarding_ratings");

      if (!rawDomains || !rawCategories || !rawCompanies || !rawRatings) {
        toast.error("Your onboarding progress is incomplete. Let's start from the beginning.");
        router.replace("/onboarding/step1");
        return;
      }

      const targetDomains = JSON.parse(rawDomains);
      const targetCategories = JSON.parse(rawCategories);
      const targetCompanySlugs = JSON.parse(rawCompanies);
      const topicSelfRatings = JSON.parse(rawRatings);
      const prepWeeksCommitted = parseInt(sessionStorage.getItem("onboarding_weeks") || "12", 10);
      const targetRole = sessionStorage.getItem("onboarding_target_role") || "SDE-1";

      if (
        !Array.isArray(targetDomains) || targetDomains.length === 0 ||
        !Array.isArray(targetCategories) || targetCategories.length === 0 ||
        !Array.isArray(targetCompanySlugs) || targetCompanySlugs.length === 0
      ) {
        toast.error("Some steps were skipped. Please complete them first.");
        router.replace("/onboarding/step2");
        return;
      }

      const result = await submitOnboarding({
        targetDomains,
        targetCategories,
        topicSelfRatings,
        targetCompanySlugs,
        prepWeeksCommitted,
        targetRole,
      });

      // Clear session storage to prevent stale data
      sessionStorage.removeItem("onboarding_domains");
      sessionStorage.removeItem("onboarding_categories");
      sessionStorage.removeItem("onboarding_companies");
      sessionStorage.removeItem("onboarding_ratings");
      sessionStorage.removeItem("onboarding_weeks");
      sessionStorage.removeItem("onboarding_target_role");

      // Force cache invalidation so the new profile loads
      const { mutate } = await import('swr');
      await mutate('/api/user/me');

      sessionStorage.setItem("has_onboarded", "true");
      toast.success(`Roadmap created! +${(result as any)?.xpAwarded ?? 100} XP earned.`);
      router.push("/onboarding/step5");
    } catch (err: any) {
      // FAILURE FIX: the old code routed to /dashboard even when NOTHING was
      // saved — leaving users with no roadmap and no way to know. Stay here so
      // they can retry.
      toast.error(err?.message ?? "Could not save your roadmap. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left brand panel */}
      <div className="hidden md:flex w-[320px] shrink-0 bg-gradient-to-br from-blue-700 to-indigo-800 flex-col justify-between px-10 py-12">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-white/20 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
            <span className="font-bold text-white text-sm">PlacePrep</span>
          </div>
          <h2 className="text-white text-3xl font-extrabold leading-tight mb-3">
            Ready to<br />launch
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Your roadmap is built. Every question, every topic, every week is now calibrated for your goals.
          </p>
        </div>
        <div className="text-blue-200 text-xs">NST Placement Prep Portal · Student Edition</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 md:px-8 py-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-6">
            <div className="bg-blue-700 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
            <span className="font-bold text-gray-900 text-sm">PlacePrep</span>
          </div>

          <Stepper currentStep={4} totalSteps={5} />
          <p className="text-xs text-gray-400 mt-2 mb-6">Step 4 of 4</p>

          {/* Hero */}
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">You&apos;re all set!</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your personalised roadmap is ready. Here&apos;s what we&apos;ve prepared:
          </p>

          {/* Summary card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-left space-y-2.5 mb-5 shadow-sm">
            {readyItems.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="flex gap-3 mb-6 justify-center">
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-xs font-medium">
              <Zap className="w-3.5 h-3.5" /> XP rewards enabled
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 rounded-lg px-3 py-2 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5" /> Daily targets set
            </div>
          </div>

          <button
            onClick={handleLaunch}
            disabled={submitting}
            className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Setting up your roadmap...</>
            ) : (
              <><Rocket className="w-4 h-4" /> Launch My Dashboard</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
