"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 border border-red-500/20 rounded-[40px] p-8 text-center backdrop-blur-xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Simulated Simulation Crash</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          An unexpected error occurred during the ML data processing. This might be due to a temporary connection issue or a data mismatch.
        </p>
        <div className="space-y-4">
           <button
            onClick={() => reset()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/5"
          >
            Go back to Dashboard
          </button>
        </div>
        <p className="mt-8 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
          Error: {error.message || "Unknown error"}
        </p>
      </div>
    </div>
  );
}
