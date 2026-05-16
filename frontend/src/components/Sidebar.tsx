"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  BarChart3, 
  Boxes, 
  Settings, 
  LogOut, 
  Store,
  ChevronRight,
  TrendingUp,
  Clock
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firebaseSignOut } from "@/lib/firebaseAuth";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const p = localStorage.getItem("business_profile");
    if (p) setProfile(JSON.parse(p));
  }, [pathname]);

  const handleLogout = async () => {
    await firebaseSignOut();
    localStorage.removeItem("business_profile");
    router.push("/login");
  };

  const navItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Trends", icon: TrendingUp, href: "/trends" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <aside className="w-64 bg-[#0a0a1e] border-r border-white/5 flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">StockSense AI</span>
      </div>

      {/* Business Profile Badge */}
      {profile && (
        <div className="px-6 mb-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl -mr-8 -mt-8" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <span className="text-2xl">{profile.sectorEmoji}</span>
              <div className="overflow-hidden">
                <p className="text-white font-bold text-xs truncate">{profile.sectorName}</p>
                <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest leading-none mt-1">{profile.businessTypeName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 relative z-10">
               <Clock className="w-3 h-3 text-indigo-400" />
               <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">May 2026 Feed</span>
            </div>

            <Link 
              href="/onboarding" 
              className="mt-3 text-[10px] text-gray-500 hover:text-indigo-400 flex items-center gap-1 transition-colors relative z-10"
            >
              Switch Sector <ChevronRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-gray-500"}`} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold uppercase ring-2 ring-white/5">
            {user?.displayName?.[0] || user?.email?.[0] || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-bold truncate">{user?.displayName || "User"}</p>
            <p className="text-gray-500 text-[10px] truncate">{user?.email || ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/5 transition-all text-sm font-medium group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
