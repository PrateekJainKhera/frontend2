"use client";

import { useState } from "react";
import { Download, FileDown } from "lucide-react";
import { downloadExcelTemplate, exportBooksToExcel } from "@/services/api";

export default function DownloadExcelButton() {
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadExcelTemplate();
    } catch (error: any) {
      alert(error.message || 'Failed to download template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleExportBooks = async () => {
    setIsExporting(true);
    try {
      await exportBooksToExcel();
    } catch (error: any) {
      alert(error.message || 'Failed to export books');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      {/* Button 1: Download Template */}
      <button
        onClick={handleDownloadTemplate}
        disabled={isDownloadingTemplate}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm w-full sm:w-auto"
      >
        {isDownloadingTemplate ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4 text-gray-500" />
            <span>Download Template</span>
          </>
        )}
      </button>

      {/* Button 2: Export All */}
      <button
        onClick={handleExportBooks}
        disabled={isExporting}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm w-full sm:w-auto"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export All Books</span>
          </>
        )}
      </button>
    </div>
  );
}
