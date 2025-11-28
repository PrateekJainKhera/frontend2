'use client';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, XCircle } from 'lucide-react';
interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  variant: 'success' | 'error';
}
export function FeedbackPopup({ isOpen, onClose, title, description, variant }: FeedbackPopupProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);
  const Icon = variant === 'success' ? CheckCircle : XCircle;
  const iconColor = variant === 'success' ? 'text-green-500' : 'text-red-500';
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto p-6">
        {/* --- YEH CHANGE KAREIN: Header add karein --- */}
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className={`h-12 w-12 ${iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}