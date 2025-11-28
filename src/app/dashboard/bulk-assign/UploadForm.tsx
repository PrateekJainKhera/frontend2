// src/app/dashboard/bulk-assign/UploadForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import api from '@/services/api';

interface Executive { id: number; name: string; roleName: string; }

interface UploadFormProps {
  onUpload: (formData: FormData) => void;
  isLoading: boolean;
  uploadType: string;
}

export function UploadForm({ onUpload, isLoading, uploadType }: UploadFormProps) {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        const response = await api.get('/executives');
        setExecutives(response.data.filter((e: Executive) => e.roleName === 'Executive'));
      } catch (error) {
        console.error("Failed to fetch executives:", error);
      }
    };
    fetchExecutives();
  }, []);

  const handleSubmit = () => {
    if (!selectedExecutiveId || !file) {
      alert("Please select an executive and a file.");
      return;
    }
    const formData = new FormData();
    formData.append('SalesExecutiveId', selectedExecutiveId);
    formData.append('AssignedMonth', new Date().toISOString());
    formData.append('File', file);
    onUpload(formData);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>1. Select Executive</Label>
        <Select value={selectedExecutiveId} onValueChange={setSelectedExecutiveId}>
          <SelectTrigger><SelectValue placeholder="Select an executive..." /></SelectTrigger>
          <SelectContent>{executives.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`file-${uploadType}`}>2. Select {uploadType} Excel File</Label>
        <Input id={`file-${uploadType}`} type="file" accept=".xlsx"
        key={file ? file.name : 'no-file'} 
         onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {file && (
          <div className="flex items-center text-sm text-gray-500 pt-2">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            <span>{file.name}</span>
          </div>
        )}
      </div>
      <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
        <UploadCloud className="h-4 w-4 mr-2" />
        {isLoading ? 'Processing...' : `Upload and Assign ${uploadType} Beat`}
      </Button>
    </div>
  );
}