"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  topLevelTypes,
  getBusinessList,
  type TopLevelType,
  type BusinessCategory,
} from "./businessData";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Sparkles,
  CheckCircle,
  X,
} from "lucide-react";

type Step = 1 | 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [topType, setTopType] = useState<TopLevelType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingBar, setLoadingBar] = useState(0);

  // Stagger the business cards on step 2
  useEffect(() => {
    if (step === 2 && topType) {
      setVisibleCount(0);
      setSearchQuery("");
      const list = getBusinessList(topType);
      list.forEach((_, i) => {
        setTimeout(() => setVisibleCount((prev) => prev + 1), i * 50);
      });
    }
  }, [step, topType]);

  // Loading bar animation on success
  useEffect(() => {
    if (showSuccess) {
      const interval = setInterval(() => {
        setLoadingBar((p) => {
          if (p >= 100) { clearInterval(interval); return 100; }
          return p + 5;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [showSuccess]);

  const businessList = topType ? getBusinessList(topType) : [];

  // Filtered list based on search
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return businessList;
    const q = searchQuery.toLowerCase();
    return businessList.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
    );
  }, [businessList, searchQuery]);

  const handleSelectType = (id: TopLevelType) => {
    setTopType(id);
    setTimeout(() => setStep(2), 150);
  };

  const handleSelectBusiness = (biz: BusinessCategory) => {
    if (!topType) return;
    const profile = {
      businessType: topType,
      businessTypeName: topLevelTypes.find((t) => t.id === topType)?.label,
      sector: biz.id,
      sectorName: biz.label,
      sectorEmoji: biz.emoji,
    };
    localStorage.setItem("business_profile", JSON.stringify(profile));
    setShowSuccess(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  const topTypeData = topLevelTypes.find((t) => t.id === topType);
  const isSearching = searchQuery.trim().length > 0;
  const displayList = isSearching ? filteredList : businessList;

  return (
    <div className="min-h-screen bg-[#080812] text-white flex flex-col items-center px-4 py-10 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-indigo-700/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-700/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ── SUCCESS OVERLAY ── */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080812]/95 backdrop-blur-md">
          <div className="flex flex-col items-center gap-5">
            <div className="relative w-28 h-28">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-ping opacity-25" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white">All Set!</h2>
              <p className="text-gray-400 mt-1">Personalizing your dashboard...</p>
            </div>
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-150 ease-linear"
                style={{ width: `${loadingBar}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="w-full max-w-4xl mb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-300 text-sm font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Setup Your Business Profile
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
          {step === 1 ? (
            <>Select Your{" "}<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Business Model</span></>
          ) : (
            <>Pick Your{" "}<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{topTypeData?.label}</span>{" "}Category</>
          )}
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          {step === 1 ? "Choose how you sell products to get started." : `Select the category that best describes your ${topTypeData?.label} business.`}
        </p>
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {topLevelTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectType(t.id)}
                className={`group relative p-8 rounded-3xl border border-white/8 bg-white/3 text-left overflow-hidden hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:${t.glow}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-0 group-hover:opacity-8 transition-opacity duration-300`} />
                <div className="relative z-10">
                  <span className="text-6xl mb-6 block">{t.icon}</span>
                  <h2 className="text-2xl font-black text-white mb-2">{t.label}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{t.description}</p>
                </div>
                <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/15 group-hover:text-white/50 group-hover:translate-x-1.5 transition-all duration-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-right-8 duration-400">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep(1)}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${topTypeData?.label} categories...`}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-white focus:outline-none focus:border-indigo-500/60 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scroll">
            {displayList.map((biz, i) => {
              const isVisible = isSearching || i < visibleCount;
              return (
                <button
                  key={biz.id}
                  onClick={() => handleSelectBusiness(biz)}
                  style={!isSearching ? {
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: `all 0.3s ease ${i * 20}ms`
                  } : {}}
                  className="group p-5 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/8 hover:border-indigo-400/40 text-left transition-all"
                >
                  <span className="text-4xl block mb-3">{biz.emoji}</span>
                  <h3 className="text-sm font-bold text-white mb-1">{biz.label}</h3>
                  <p className="text-[11px] text-gray-500 line-clamp-2">{biz.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
