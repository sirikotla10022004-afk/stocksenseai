"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  User, 
  Building2, 
  Database, 
  Shield, 
  Bell, 
  Trash2, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getToken, API_BASE } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("General");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [success, setSuccess] = useState("");
  const [preferences, setPreferences] = useState({
    reports: true,
    alerts: true,
    analytics: false
  });


  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }
    const p = localStorage.getItem("business_profile");
    if (p) setProfile(JSON.parse(p));
    fetchStatus();
  }, [user, authLoading, router]);


  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/custom-data-status`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteData = async () => {
    if (!confirm("Are you sure? This will permanently delete your custom dataset and revert to defaults.")) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/custom-data`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setSuccess("Custom dataset successfully removed.");
      fetchStatus();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-500">Manage your business profile and platform preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
           {[
             { name: "General", icon: Settings },
             { name: "Account", icon: User },
             { name: "Security", icon: Shield },
             { name: "Notifications", icon: Bell },
           ].map(item => (
             <button 
               key={item.name}
               onClick={() => setActiveTab(item.name)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm relative z-20 ${
                 activeTab === item.name ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-gray-500 hover:text-white hover:bg-white/5"
               }`}
             >
               <item.icon className="w-4 h-4" />
               {item.name}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
           {activeTab === "General" && (
             <>
               {/* Business Profile */}
               <section className="p-8 rounded-[40px] bg-white/3 border border-white/8 space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Building2 className="w-6 h-6" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-white">Business Profile</h2>
                        <p className="text-xs text-gray-500">Information used to calibrate ML models</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Business Model</label>
                        <div className="p-4 rounded-2xl bg-white/2 border border-white/5 text-sm font-medium text-white capitalize">
                           {profile.businessType}
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Industry Sector</label>
                        <div className="p-4 rounded-2xl bg-white/2 border border-white/5 text-sm font-medium text-white flex items-center gap-2">
                           <span>{profile.sectorEmoji}</span> {profile.sectorName}
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={() => router.push('/onboarding')}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-configure Business Profile
                  </button>
               </section>


               {/* Platform Preferences */}
               <section className="p-8 rounded-[40px] bg-white/3 border border-white/8 space-y-6">
                  <h2 className="text-lg font-bold text-white">Preferences</h2>
                  <div className="space-y-4">
                        <div className="flex items-center justify-between p-2">
                           <div className="max-w-md">
                              <p className="text-sm font-bold text-white mb-1">Weekly Trend Reports</p>
                              <p className="text-xs text-gray-500">Receive automated analysis of your top products via email.</p>
                           </div>
                           <button 
                             onClick={() => setPreferences(prev => ({ ...prev, reports: !prev.reports }))}
                             className={`w-12 h-6 rounded-full relative transition-all ${preferences.reports ? "bg-indigo-600" : "bg-white/10"}`}
                           >
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${preferences.reports ? "right-1" : "left-1"}`} />
                           </button>
                        </div>
                        <div className="flex items-center justify-between p-2">
                           <div className="max-w-md">
                              <p className="text-sm font-bold text-white mb-1">Stockout Alerts</p>
                              <p className="text-xs text-gray-500">Get notified when demand projection exceeds current stock levels.</p>
                           </div>
                           <button 
                             onClick={() => setPreferences(prev => ({ ...prev, alerts: !prev.alerts }))}
                             className={`w-12 h-6 rounded-full relative transition-all ${preferences.alerts ? "bg-indigo-600" : "bg-white/10"}`}
                           >
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${preferences.alerts ? "right-1" : "left-1"}`} />
                           </button>
                        </div>
                  </div>
               </section>
             </>
           )}

           {activeTab === "Account" && (
             <section className="p-8 rounded-[40px] bg-white/3 border border-white/8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <User className="w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-lg font-bold text-white">Account Settings</h2>
                      <p className="text-xs text-gray-500">Manage your personal identification and subscription</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="p-6 rounded-3xl bg-white/2 border border-white/5 space-y-4">
                      <div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-2">Email Address</label>
                         <p className="text-sm font-bold text-white">{user?.email || "k.siri@stocksense.ai"}</p>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-2">Subscription Tier</label>
                         <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase rounded-full">Professional AI</span>
                            <p className="text-xs text-gray-500">Renewing on June 01, 2026</p>
                         </div>
                      </div>
                   </div>
                   
                   <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all">
                      Change Registered Email
                   </button>
                </div>
             </section>
           )}

           {activeTab === "Security" && (
             <section className="p-8 rounded-[40px] bg-white/3 border border-white/8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                      <Shield className="w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-lg font-bold text-white">Security & Access</h2>
                      <p className="text-xs text-gray-500">Protect your account with advanced authentication</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-3xl">
                      <div>
                         <p className="text-sm font-bold text-white mb-1">Two-Factor Authentication</p>
                         <p className="text-xs text-gray-500">Secure your login with a mobile verification code.</p>
                      </div>
                      <button 
                        onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                        className={`w-12 h-6 rounded-full relative transition-all ${preferences.analytics ? "bg-green-600" : "bg-white/10"}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${preferences.analytics ? "right-1" : "left-1"}`} />
                      </button>
                   </div>
                   <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all">
                      Reset Password
                   </button>
                </div>
             </section>
           )}

           {activeTab === "Notifications" && (
             <section className="p-8 rounded-[40px] bg-white/3 border border-white/8 space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                      <Bell className="w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-lg font-bold text-white">Notification Center</h2>
                      <p className="text-xs text-gray-500">Choose how you receive intelligence updates</p>
                   </div>
                </div>

                <div className="space-y-4">
                   {[
                     { name: "Browser Push", desc: "Real-time desktop alerts for inventory risks." },
                     { name: "Email Digest", desc: "Summary of daily demand shifts and model accuracy." },
                     { name: "Slack Integration", desc: "Send automated alerts to your team channels." }
                   ].map((n, i) => (
                     <div key={n.name} className="flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-3xl">
                        <div>
                           <p className="text-sm font-bold text-white mb-1">{n.name}</p>
                           <p className="text-xs text-gray-500">{n.desc}</p>
                        </div>
                        <button 
                          className={`w-12 h-6 rounded-full relative transition-all ${i < 2 ? "bg-indigo-600" : "bg-white/10"}`}
                        >
                           <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${i < 2 ? "right-1" : "left-1"}`} />
                        </button>
                     </div>
                   ))}
                </div>
             </section>
           )}

        </div>

      </div>
    </div>
  );
}
