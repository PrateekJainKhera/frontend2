"use client";

import { useState, useRef } from "react";
import { Upload, FileUp } from "lucide-react";
import { bulkUploadBooks } from "@/services/api";

interface BulkUploadResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

interface BulkUploadButtonProps {
  onUploadComplete: () => void;
}

export default function BulkUploadButton({ onUploadComplete }: BulkUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      alert('Please select an Excel file (.xlsx)');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const result = await bulkUploadBooks(file);
      setUploadResult(result);
      setShowResult(true);

      if (result.successCount > 0) {
        onUploadComplete();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

 return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={handleButtonClick}
        disabled={isUploading}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm w-full"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-gray-500" />
            <span>Bulk Upload</span>
          </>
        )}
      </button>

      {/* Result Modal (Keep existing logic, just ensuring z-index is high) */}
      {showResult && uploadResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-9999 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-900">Upload Results</h3>
                 <button onClick={() => setShowResult(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-blue-900">{uploadResult.totalRows}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                  <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Success</p>
                  <p className="text-2xl font-bold text-green-900">{uploadResult.successCount}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                  <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Failed</p>
                  <p className="text-2xl font-bold text-red-900">{uploadResult.failureCount}</p>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    ⚠️ Errors Found
                  </h4>
                  <div className="bg-red-50 rounded-lg p-4 max-h-48 overflow-y-auto border border-red-100">
                    <ul className="space-y-2 text-sm">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index} className="text-red-800 flex items-start gap-2">
                          <span className="mt-1">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowResult(false)}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
