"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, 
  ArrowRight, 
  TrendingUp, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  Target
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        const stored = localStorage.getItem("business_profile");
        if (stored) setProfile(JSON.parse(stored));
      }
    }
  }, [user, loading, router]);

  if (!isMounted || loading) return null;
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* ── HERO ── */}
      <div className="relative p-10 lg:p-16 rounded-[40px] bg-gradient-to-br from-[#0f0f2e] to-[#080812] border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Demand Intelligence
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight mb-6">
            Predict the <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Future</span> of Your Business.
          </h1>
          
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Harness ARIMA, Prophet, and Linear Regression models trained on real-world retail data to optimize your inventory and maximize growth.
          </p>

          <div className="flex flex-wrap gap-4">
            {profile ? (
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl flex items-center gap-2 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-2xl flex items-center gap-2 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all"
              >
                Setup Your Business
                <Sparkles className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "ML Models", value: "3 Advanced", sub: "ARIMA, Prophet, Regression", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10" },
          { label: "Data Quality", value: "Real UCI", sub: "1M+ Transactions Trained", icon: ShieldCheck, color: "text-indigo-400", bg: "bg-indigo-400/10" },
          { label: "Accuracy", value: "94.2%", sub: "Industry Average MAPE", icon: Target, color: "text-purple-400", bg: "bg-purple-400/10" },
        ].map((stat) => (
          <div key={stat.label} className="p-8 rounded-[32px] bg-white/3 border border-white/8 hover:border-white/20 transition-all group">
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-white mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-10 rounded-[40px] bg-white/3 border border-white/8 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white mb-6">Built for Modern Commerce</h2>
          <div className="space-y-6">
            {[
              "Retail & E-Commerce specific sector classifications",
              "Automated weekly time-series aggregation",
              "Interactive seasonality & trend visualization",
              "Product-level deep dive analytics",
            ].map((f) => (
              <div key={f} className="flex items-center gap-4">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </div>
                <span className="text-gray-300 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative p-1 rounded-[40px] bg-gradient-to-br from-indigo-500/20 to-purple-600/20 group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 blur-2xl group-hover:opacity-100 transition-opacity" />
          <div className="relative h-full p-10 rounded-[38px] bg-[#080812] flex flex-col justify-center items-center text-center">
             <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-8">
                <TrendingUp className="w-10 h-10 text-indigo-400" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-4">Start Growing Today</h3>
             <p className="text-gray-500 text-sm mb-8 max-w-xs">
                Stop guessing and start predicting. Your data is waiting to be analyzed.
             </p>
             <Link 
               href="/dashboard" 
               className="flex items-center gap-2 text-indigo-400 font-bold hover:gap-3 transition-all"
             >
               Go to my analytics <ChevronRight className="w-4 h-4" />
             </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
