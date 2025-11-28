// src/hooks/useVisitState.ts
'use client';

import { useState, useEffect } from 'react';

// Define the complete shape of the data we want to save
interface TeacherInfo {
  name: string;
  whatsAppNumber: string;
    subjectsTaught: { classLevel: string; subject: string; }[];


}

interface VisitFormData {
  principalName: string;
  principalMobile: string;
  studentCount: string;
  principalRemarks: string;
  permissionGranted: boolean;
  teachersFromPrincipal: TeacherInfo[];
}

export function useVisitState(visitId: number | null) {
  const getStorageKey = (id: number) => `visit_in_progress_${id}`;

  const getInitialState = (): VisitFormData => ({
    principalName: '',
    principalMobile: '',
    studentCount: '',
    principalRemarks: '',
    permissionGranted: false,
    teachersFromPrincipal: [],
  });

  const [formData, setFormData] = useState<VisitFormData>(getInitialState);

  // This effect loads data when the visitId becomes available
  useEffect(() => {
    if (visitId) {
      try {
        const savedData = localStorage.getItem(getStorageKey(visitId));
        if (savedData) {
          setFormData(JSON.parse(savedData));
        } 
      } catch (error) {
        console.error("Failed to parse saved data:", error);
        setFormData(getInitialState());
      }
    }
  }, [visitId]);

  // This effect saves data whenever it changes
  useEffect(() => {
    if (visitId) {
      localStorage.setItem(getStorageKey(visitId), JSON.stringify(formData));
    }
  }, [formData, visitId]);

  const clearSavedState = () => {
    if (visitId) {
      localStorage.removeItem(getStorageKey(visitId));
    }
  };

  return { formData, setFormData, clearSavedState };
}