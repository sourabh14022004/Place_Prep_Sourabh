"use client";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Rocket, CheckCircle, Zap, Calendar } from "lucide-react";
import Stepper from "@/components/onboarding/Stepper";
import { saveStudentOnboarding } from "@/lib/api";

const readyItems = [
  "Custom roadmap based on your timeline and goals",
  "Daily practice plan tailored to your topic ratings",
  "Company-tagged questions from your target categories",
  "XP milestones and bi-weekly progress check-ins",
];

export default function Step4() {
  const router = useRouter();
  const { user } = useUser();

  const handleLaunch = async () => {
    try {
      const storedCategories = sessionStorage.getItem("onboarding_categories");
      const storedCompanies = sessionStorage.getItem("onboarding_companies");
      const storedRatings = sessionStorage.getItem("onboarding_ratings");
      const storedDuration = sessionStorage.getItem("onboarding_duration");

      const targetCategories = storedCategories ? JSON.parse(storedCategories) : ["maang", "product"];
      const targetCompanies = storedCompanies ? JSON.parse(storedCompanies) : ["google", "amazon"];
      const topicRatings = storedRatings ? JSON.parse(storedRatings) : {};
      const prepDurationWeeks = storedDuration ? parseInt(storedDuration, 10) : 12;

      const clerkUserId = user?.id;
      const userEmail = user?.primaryEmailAddress?.emailAddress || "student@newtonschool.co";
      const userName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || userEmail.split("@")[0];

      // Save onboarding data to MongoDB Atlas dynamically from Clerk profile
      await saveStudentOnboarding({
        clerkUserId,
        email: userEmail,
        name: userName,
        targetCategories,
        targetCompanies,
        prepDurationWeeks,
        topicRatings,
      });

      if (storedCompanies) {
        const companies: string[] = JSON.parse(storedCompanies);
        const companyData: Record<string, { name: string; initial: string; color: string }> = {
          google:    { name: "Google",    initial: "G", color: "bg-blue-600" },
          amazon:    { name: "Amazon",    initial: "A", color: "bg-blue-500" },
          flipkart:  { name: "Flipkart",  initial: "F", color: "bg-blue-500" },
          microsoft: { name: "Microsoft", initial: "M", color: "bg-blue-600" },
          tcs:       { name: "TCS",       initial: "T", color: "bg-blue-600" },
          razorpay:  { name: "Razorpay",  initial: "R", color: "bg-blue-800" },
        };
        const roadmapEntries = companies
          .filter((slug) => companyData[slug])
          .map((slug) => ({ slug, ...companyData[slug], role: "SDE-1", weeks: 12, addedAt: new Date().toISOString() }));
        if (roadmapEntries.length > 0) {
          sessionStorage.setItem("roadmap_companies", JSON.stringify(roadmapEntries));
        }
      }
      sessionStorage.setItem("has_onboarded", "true");
      document.cookie = "has_onboarded=true; path=/; max-age=31536000";
      document.cookie = "student_authed=true; path=/; max-age=31536000";
    } catch (err) {
      console.warn("Failed to persist onboarding data:", err);
    }
    router.push("/dashboard");
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

          <Stepper currentStep={4} totalSteps={4} />
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
            className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4" /> Launch My Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
