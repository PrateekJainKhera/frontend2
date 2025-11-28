// src/app/dashboard/CreateBeatPlanModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, School, Send } from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';

interface School {
  id: number;
  name: string;
}

interface CreateBeatPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // To refetch the plan list
}

export function CreateBeatPlanModal({ isOpen, onClose, onSuccess }: CreateBeatPlanModalProps) {
  const { user } = useAuthContext();
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };
  const [planDate, setPlanDate] = useState<Date | undefined>(new Date());
    const [selectedSchoolIds, setSelectedSchoolIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  

  useEffect(() => {
    if (isOpen) {
      const fetchSchools = async () => {
        try {
          const response = await api.get('/schools');
          setAllSchools(response.data);
        } catch (err) {
          console.error("Failed to fetch schools", err);
          setError("Could not load school list.");
        }
      };
      fetchSchools();
    } else {
      // Reset state when modal closes
      setSelectedSchoolIds([]);
      setPlanDate(new Date());
      setError('');
    }
  }, [isOpen]);

  const handleSchoolSelect = (schoolId: number) => {
    setSelectedSchoolIds(prev =>
      prev.includes(schoolId)
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  const handleSubmitPlan = async () => {
    if (!user || !planDate || selectedSchoolIds.length === 0) {
      setError("Please select a date and at least one school.");
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const payload = {
        salesExecutiveId: user.id,
        planDate: planDate.toISOString(),
        schoolIds: selectedSchoolIds,
      };
      await api.post('/beatplans', payload);
      onSuccess(); // Tell the parent page to refetch data
      onClose();   // Close this modal
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create plan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Calendar className="h-6 w-6 mr-2" />
            Create a New Beat Plan
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Plan Date</Label>
            <DatePicker date={planDate} onSelect={setPlanDate} />
          </div>
          <div className="space-y-2">
            <Label>Select Schools to Visit</Label>
            <Card>
              <CardContent className="p-2 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {allSchools.map(school => (
                    <div key={school.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                      <Checkbox
                        id={`school-${school.id}`}
                        checked={selectedSchoolIds.includes(school.id)}
                        onCheckedChange={() => handleSchoolSelect(school.id)}
                      />
                      <label htmlFor={`school-${school.id}`} className="flex-1 cursor-pointer">{school.name}</label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-gray-500">{selectedSchoolIds.length} schools selected.</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmitPlan} disabled={isLoading}>
            {isLoading ? 'Saving...' : <><Send className="h-4 w-4 mr-2" /> Save Plan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}