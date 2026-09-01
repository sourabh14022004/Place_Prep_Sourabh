"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Building2, Briefcase, Server, Rocket, Landmark, MoreHorizontal, CheckCircle,
} from "lucide-react";
import Stepper from "@/components/onboarding/Stepper";
import { type CompanyCategory } from "@/lib/constants";

const categories: { id: CompanyCategory; icon: React.ComponentType<{ className?: string }>; label: string; desc: string }[] = [
  { id: "maang",   icon: Building2,      label: "MAANG / Big Tech",    desc: "Google, Meta, Amazon, Apple, Netflix" },
  { id: "product", icon: Briefcase,      label: "Product-Based",       desc: "Mid-size, Series B+ companies" },
  { id: "service", icon: Server,         label: "Service-Based",       desc: "TCS, Infosys, Wipro, Cognizant" },
  { id: "startup", icon: Rocket,         label: "Startup",             desc: "Early stage, high-growth" },
  { id: "bfsi",    icon: Landmark,       label: "Finance / BFSI",      desc: "Goldman, JP Morgan, fintech" },
  { id: "other",   icon: MoreHorizontal, label: "Other",               desc: "Research, academia, mixed" },
];

export default function Step2() {
  const [selected, setSelected] = useState<CompanyCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = (id: CompanyCategory) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
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
            Target the<br />right companies
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Your company category shapes the topics, question patterns, and difficulty level of your roadmap.
          </p>
        </div>
        <div className="text-blue-300 text-xs">NST Placement Prep Portal · Student Edition</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 md:px-8 py-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 mb-6">
            <div className="bg-blue-700 rounded px-2 py-1 text-white font-bold text-xs">NST</div>
            <span className="font-bold text-gray-900 text-sm">PlacePrep</span>
          </div>

          <Stepper currentStep={2} totalSteps={5} />
          <p className="text-xs text-gray-400 mt-2 mb-5">Step 2 of 4</p>
          <h1 className="text-xl font-bold text-gray-900 mb-1">What type of company are you targeting?</h1>
          <p className="text-sm text-gray-500 mb-5">Select all that apply — your prep will be tailored accordingly</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {categories.map(({ id, icon: Icon, label, desc }) => {
              const isSelected = selected.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${isSelected ? "bg-blue-50 border-blue-500" : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  {isSelected && <CheckCircle className="absolute top-2 right-2 w-3.5 h-3.5 text-blue-600" />}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-blue-100" : "bg-gray-100"}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <div className={`text-xs font-semibold leading-tight ${isSelected ? "text-blue-700" : "text-gray-900"}`}>{label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/onboarding/step1")}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              disabled={loading || selected.length === 0}
              onClick={async () => {
                if (typeof window === "undefined") return;
                sessionStorage.setItem("onboarding_categories", JSON.stringify(selected));
                setLoading(true);
                try {
                  // Fetch real company slugs for each selected category from the DB.
                  // FIX: use allSettled — a total network failure previously saved an
                  // empty list silently and step3 then blamed "this role".
                  const settled = await Promise.allSettled(
                    selected.map((cat) =>
                      fetch(`/api/companies?category=${cat}`)
                        .then((r) => {
                          if (!r.ok) throw new Error(`API ${r.status}`);
                          return r.json();
                        })
                        .then((d) => (Array.isArray(d.data) ? d.data : []) as Array<{ slug: string }>)
                    )
                  );
                  const seen = new Set<string>();
                  const slugs: string[] = [];
                  let okCount = 0;
                  for (const s of settled) {
                    if (s.status === "fulfilled") {
                      okCount++;
                      for (const c of s.value) {
                        if (!seen.has(c.slug)) { seen.add(c.slug); slugs.push(c.slug); }
                      }
                    }
                  }
                  if (okCount === 0) {
                    setLoading(false);
                    toast.error("Couldn't load companies. Check your connection and try again.");
                    return;
                  }
                  sessionStorage.setItem("onboarding_companies", JSON.stringify(slugs.slice(0, 6)));
                } finally {
                  setLoading(false);
                  router.push("/onboarding/step3");
                }
              }}
              className="flex-1 bg-gray-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
