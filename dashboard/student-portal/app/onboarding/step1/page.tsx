"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Code2, Monitor, Brain, BarChart2, Cloud, Layers, CheckCircle } from "lucide-react";
import Stepper from "@/components/onboarding/Stepper";
import { fetchStudentProfile } from "@/lib/api";

const domains = [
  { icon: Code2,    label: "SDE / Software Engineering" },
  { icon: Monitor,  label: "Frontend / Full Stack" },
  { icon: Brain,    label: "Data Science / ML" },
  { icon: BarChart2,label: "Data Analyst" },
  { icon: Cloud,    label: "DevOps / Cloud" },
  { icon: Layers,   label: "Other" },
];

export default function Step1() {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    async function checkAlreadyOnboarded() {
      try {
        const sessionOnboarded = sessionStorage.getItem("has_onboarded") === "true";
        const cookieOnboarded = document.cookie.split("; ").some((c) => c.startsWith("has_onboarded=true"));
        if (sessionOnboarded || cookieOnboarded) {
          router.replace("/dashboard");
          return;
        }
        if (user?.id || user?.primaryEmailAddress?.emailAddress) {
          const profile = await fetchStudentProfile(user.id, user.primaryEmailAddress?.emailAddress);
          if (profile?.hasOnboarded) {
            sessionStorage.setItem("has_onboarded", "true");
            document.cookie = "has_onboarded=true; path=/; max-age=31536000";
            router.replace("/dashboard");
          }
        }
      } catch { /* ignore */ }
    }
    checkAlreadyOnboarded();
  }, [user, router]);

  const toggle = (label: string) => {
    setSelected((s) => s.includes(label) ? s.filter((x) => x !== label) : [...s, label]);
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
            Build your<br />prep path
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Answer 4 quick questions and we&apos;ll generate a custom roadmap tailored to your target companies and timeline.
          </p>
        </div>
        <div className="text-blue-300 text-xs">
          NST Placement Prep Portal · Student Edition
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 md:px-8 py-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-6">
            <div className="bg-blue-700 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
            <span className="font-bold text-gray-900 text-sm">PlacePrep</span>
          </div>

          <Stepper currentStep={1} totalSteps={4} />
          <p className="text-xs text-gray-400 mt-2 mb-5">Step 1 of 4</p>
          <h1 className="text-xl font-bold text-gray-900 mb-1">What are you preparing for?</h1>
          <p className="text-sm text-gray-500 mb-5">Select all domains you want to cover</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {domains.map(({ icon: Icon, label }) => {
              const isSelected = selected.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => toggle(label)}
                  className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 text-xs font-medium transition-all ${ isSelected ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  {isSelected && <CheckCircle className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-blue-600" />}
                  <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                  <span className="text-center leading-tight">{label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => selected.length > 0 && router.push("/onboarding/step2")}
            disabled={selected.length === 0}
            className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${selected.length > 0 ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
