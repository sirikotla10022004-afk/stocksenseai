"use client";

import { useState } from "react";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { apiUploadDataset } from "@/lib/auth";

export default function DataUpload({ onSuccess, onClose }: { onSuccess: () => void, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      await apiUploadDataset(file);
      setMessage({ text: "File uploaded successfully!", type: "success" });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Failed to upload file. Check console.", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f0f2e] border border-white/10 rounded-[32px] p-8 w-full max-w-md relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">Upload Custom Data</h2>
          <p className="text-sm text-gray-500 mt-2">Upload your own sales history to train the AI model specifically for your business.</p>
        </div>

        <div className="space-y-6">
          <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer relative group">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 group-hover:text-indigo-300 transition-all">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Click or drag CSV file to upload</h3>
            <p className="text-[10px] text-gray-500 max-w-xs uppercase font-black tracking-widest mt-2">
              Must contain: date, quantity
            </p>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-white/5 border border-indigo-500/30 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <File size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white line-clamp-1">{file.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {message && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold ${
                message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-2xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 className="animate-spin" size={20} /> : <span>Process & Train AI</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
