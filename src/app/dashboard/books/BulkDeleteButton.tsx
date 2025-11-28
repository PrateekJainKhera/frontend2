"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { bulkDeleteBooks } from "@/services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BulkDeleteResult {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

interface BulkDeleteButtonProps {
  selectedBookIds: number[];
  onDeleteComplete: () => void;
  onClearSelection: () => void;
}

export default function BulkDeleteButton({
  selectedBookIds,
  onDeleteComplete,
  onClearSelection
}: BulkDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteResult, setDeleteResult] = useState<BulkDeleteResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirm(false);
    setIsDeleting(true);

    try {
      const result = await bulkDeleteBooks(selectedBookIds);
      setDeleteResult(result);
      setShowResult(true);

      if (result.successCount > 0) {
        onDeleteComplete();
        onClearSelection();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete books');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        disabled={selectedBookIds.length === 0 || isDeleting}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isDeleting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4" />
            Delete Selected ({selectedBookIds.length})
          </>
        )}
      </button>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedBookIds.length} book{selectedBookIds.length > 1 ? 's' : ''}.
              This action cannot be undone. Some books may fail to delete if they are in use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, delete {selectedBookIds.length} book{selectedBookIds.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Results Dialog */}
      {showResult && deleteResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Delete Results</h3>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Requested</p>
                  <p className="text-2xl font-bold text-blue-900">{deleteResult.totalRequested}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Deleted</p>
                  <p className="text-2xl font-bold text-green-900">{deleteResult.successCount}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-900">{deleteResult.failureCount}</p>
                </div>
              </div>

              {deleteResult.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                  <div className="bg-red-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <ul className="space-y-1 text-sm">
                      {deleteResult.errors.map((error, index) => (
                        <li key={index} className="text-red-800">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowResult(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
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
