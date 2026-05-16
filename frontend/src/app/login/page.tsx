"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3, Eye, EyeOff, ArrowRight,
  Sparkles, TrendingUp, ShieldCheck, Mail, CheckCircle2,
} from "lucide-react";
import {
  firebaseSignIn,
  firebaseSendPasswordReset,
  firebaseErrorMessage,
} from "@/lib/firebaseAuth";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "forgot">("login");

  // Form fields
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // UI state
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (view === "forgot") {
        await firebaseSendPasswordReset(email);
        setResetSent(true);
        return;
      }

      await firebaseSignIn(email, password);
      
      // Redirect after successful auth
      const profile = localStorage.getItem("business_profile");
      router.push(profile ? "/dashboard" : "/onboarding");

    } catch (err) {
      setError(firebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp,  label: "ARIMA & Prophet ML Models",      sub: "Trained on real retail transaction data" },
    { icon: Sparkles,    label: "Business-Specific Analytics",     sub: "Retail & E-Commerce classified insights" },
    { icon: ShieldCheck, label: "Secure & Private",                sub: "Firebase-authenticated, your data stays yours" },
  ];

  return (
    <div className="min-h-screen bg-[#080812] flex overflow-hidden">
      {/* LEFT PANEL — Brand Hero */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#0f0f2e] via-[#0a0a1e] to-[#080812]">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">StockSense <span className="text-indigo-400">AI</span></span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-4">
              Know your market.<br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Before it moves.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              ML-powered demand forecasting for retail and e-commerce businesses.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-4 bg-white/5 border border-white/8 rounded-2xl px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.label}</p>
                  <p className="text-gray-500 text-xs">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-gray-600 text-xs">Powered by Firebase Auth · Predictive Analytics</p>
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2">
              {view === "login" ? "Welcome back" : resetSent ? "Check your inbox" : "Reset password"}
            </h2>
            <p className="text-gray-500">
              {view === "login" 
                ? "Sign in to access your personalized dashboard." 
                : resetSent 
                ? "Password reset link sent to your email" 
                : "Enter your email to receive a password reset link."}
            </p>
          </div>

          {/* Firebase Configuration Warning */}
          {!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Configuration Needed</p>
              <p className="text-gray-400 text-[10px] leading-relaxed">
                Firebase keys are missing in <code className="text-amber-200">.env.local</code>. 
                Please add your API key to enable authentication.
              </p>
            </div>
          )}

          {resetSent ? (
            <div className="space-y-4 text-center">
              <div className="p-8 bg-green-500/10 border border-green-500/25 rounded-3xl flex flex-col items-center gap-4">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
                <p className="text-green-300 font-semibold">Success! Link sent.</p>
                <p className="text-gray-400 text-sm">
                  We've sent a recovery link to <span className="text-white">{email}</span>. 
                  Check your inbox and follow the instructions.
                </p>
              </div>
              <button
                onClick={() => { setView("login"); setResetSent(false); }}
                className="w-full py-4 rounded-2xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-all"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                    />
                  </div>
                </div>

                {view === "login" && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-sm font-medium text-gray-300">Password</label>
                      <button
                        type="button"
                        onClick={() => setView("forgot")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-base hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {view === "login" ? "Sign In" : "Send Reset Link"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6 space-y-4">
                {view === "login" ? (
                  <p className="text-gray-600 text-xs">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-indigo-400 hover:underline">Sign up free</Link>
                  </p>
                ) : (
                  <button onClick={() => setView("login")} className="text-indigo-400 text-xs hover:underline">
                    Back to Sign In
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
