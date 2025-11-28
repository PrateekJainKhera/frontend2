// src/app/dashboard/SelectVisitTypeModal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, Store, UserSquare, ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SelectVisitTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
    onPlanCreated: () => void; // Add this line

  // The onPlanCreated prop is no longer needed here as each page handles its own success logic
}

export function SelectVisitTypeModal({ isOpen, onClose }: SelectVisitTypeModalProps) {
  const router = useRouter();

  // A single, simple handler to navigate to the correct page
  const handleSelect = (path: string) => {
    onClose(); // Close the modal first
    router.push(path); // Then navigate
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">How would you like to plan?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-6">
          {/* Primary Action: Plan from the assigned list */}
          <Button
            variant="default"
            className="w-full h-20 flex-col gap-2 text-lg bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleSelect('/dashboard/plan-list')}
          >
            <ListChecks className="h-8 w-8" />
            <span className="font-semibold">Plan from Assigned List</span>
          </Button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-950">
                Or Start an Ad-Hoc Visit
              </span>
            </div>
          </div>

          {/* Secondary, Ad-Hoc Visit Options */}
          <div className="grid grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-28 flex flex-col gap-2" 
              onClick={() => handleSelect('/dashboard/plan/map')}
            >
              <Building2 className="h-8 w-8 text-blue-500" />
              <span className="font-semibold">School (Map)</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-28 flex flex-col gap-2" 
              onClick={() => handleSelect('/dashboard/quick-visit?type=shopkeeper')}
            >
              <Store className="h-8 w-8 text-green-500" />
              <span className="font-semibold">Shopkeeper</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-28 flex flex-col gap-2" 
              onClick={() => handleSelect('/dashboard/quick-visit?type=tuition')}
            >
              <UserSquare className="h-8 w-8 text-purple-500" />
              <span className="font-semibold">Coaching</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}