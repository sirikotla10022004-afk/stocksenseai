"use client";

import { useState } from "react";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isForecasting, setIsForecasting] = useState(false);
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
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage({ text: "File uploaded successfully!", type: "success" });
      setFile(null);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Failed to upload file. Check console.", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleForecast = async () => {
    setIsForecasting(true);
    try {
      await api.post("/forecast");
      setMessage({ text: "Forecast generated successfully!", type: "success" });
    } catch (error) {
      console.error(error);
      setMessage({ text: "Failed to generate forecast.", type: "error" });
    } finally {
      setIsForecasting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-colors cursor-pointer relative group">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="p-4 bg-white rounded-full shadow-sm group-hover:shadow text-indigo-500 mb-4 transition-all">
          <UploadCloud size={32} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Click or drag CSV file to upload</h3>
        <p className="text-xs text-gray-500 max-w-xs">
          Ensure your CSV contains: date, product_code, name, quantity, current_stock.
        </p>
      </div>

      {file && (
        <div className="flex items-center justify-between p-3 bg-white border border-indigo-100 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
              <File size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 line-clamp-1">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            onClick={() => setFile(null)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {message && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? <Loader2 className="animate-spin" size={18} /> : <span>Upload Data</span>}
        </button>
        <button
          onClick={handleForecast}
          disabled={isForecasting}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isForecasting ? <Loader2 className="animate-spin" size={18} /> : <span>Run Forecast</span>}
        </button>
      </div>
    </div>
  );
}
