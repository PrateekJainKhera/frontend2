'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UploadCloud, Download } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Executive { id: number; name: string; roleName: string; }

// Main Page Component
export default function BulkAssignPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [executives, setExecutives] = useState<Executive[]>([]);
  
  // Form State
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSimpleUpload, setIsSimpleUpload] = useState(true);
  const [locationType, setLocationType] = useState('0'); // 0=School, 1=Coaching, 2=Shopkeeper
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        const response = await api.get('/executives');
        // Filter for only executives to populate the dropdown
        setExecutives(response.data.filter((e: Executive) => e.roleName === 'Executive'));
      } catch (error) {
        console.error("Failed to fetch executives:", error);
      }
    };
    fetchExecutives();
  }, []);

  const handleUpload = async () => {
    if (!selectedExecutiveId || !file) {
      toast({
        title: "Incomplete Form",
        description: "Please select an executive, a location type, and a file.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('salesExecutiveId', selectedExecutiveId);
    formData.append('File', file);

    let endpoint = '';
    
    if (isSimpleUpload) {
      // Logic for the new, simple workflow
      endpoint = '/monthly-tasks/upload';
      const monthString = new Date().toISOString().substring(0, 7); // Format: YYYY-MM
      formData.append('assignedMonth', monthString);
      formData.append('locationType', locationType);
    } else {
      // Logic for the old, complex geocoding workflow
      formData.append('AssignedMonth', new Date().toISOString());
      if (locationType === '0') endpoint = '/beat-upload/schools';
      else if (locationType === '1') endpoint = '/beat-upload/coaching';
      else if (locationType === '2') endpoint = '/beat-upload/shopkeepers';
    }

    if (!endpoint) {
        toast({ title: "Error", description: "Could not determine the correct upload endpoint.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const response = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ 
        title: "✅ Success", 
        description: response.data.message
      });
      // Reset form and show success state
      setFile(null);
      setSelectedExecutiveId('');
      setUploadSuccess(true);
      
      // Auto-hide success message after 10 seconds
      setTimeout(() => setUploadSuccess(false), 10000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: err.response?.data?.message || "An error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Bulk Beat Assignment</h2>
        <p className="text-gray-500">Upload an Excel file to assign a monthly beat to an executive.</p>
      </div>
      
      {uploadSuccess && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-900">Upload Successful!</p>
                  <p className="text-sm text-green-700">Beat assignments have been saved to the database.</p>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = '/dashboard/view-assignments'}
                className="bg-green-600 hover:bg-green-700"
              >
                View Assignments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Beat File</CardTitle>
<CardDescription>
            Required Columns: S.No,
            <span className="font-bold">
              {locationType === '0' ? ' School Name' : locationType === '1' ? ' Coaching Name' : ' Shopkeeper Name'}
            </span>
            , Area, District, Address.
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/beat-upload/template?locationType=${locationType}`}
              className="text-blue-600 hover:underline ml-2 font-medium inline-flex items-center gap-1"
              download
            >
              <Download className="h-3.5 w-3.5" />
              Download Excel Template
            </a>
          </CardDescription>        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2 rounded-lg border bg-gray-50 p-4">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="upload-mode" className="font-semibold">Simple Task List Mode</Label>
              <span className="text-xs text-gray-500">No geocoding. Creates a simple to-do list for the executive.</span>
            </div>
            <Switch id="upload-mode" checked={isSimpleUpload} onCheckedChange={setIsSimpleUpload} />
          </div>

          <div className="space-y-2">
            <Label>1. Select Executive</Label>
            <Select value={selectedExecutiveId} onValueChange={setSelectedExecutiveId}>
              <SelectTrigger><SelectValue placeholder="Select an executive..." /></SelectTrigger>
              <SelectContent>{executives.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>2. What type of locations are in this file?</Label>
            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger><SelectValue placeholder="Select a location type..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">School</SelectItem>
                <SelectItem value="1">Coaching Center</SelectItem>
                <SelectItem value="2">Shopkeeper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>3. Select Excel File</Label>
            <Input 
              type="file" 
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              key={file ? 'file-loaded' : 'no-file'} // Trick to reset file input
            />
          </div>

          <Button onClick={handleUpload} disabled={isLoading} className="w-full">
            <UploadCloud className="h-4 w-4 mr-2" />
            {isLoading ? 'Processing...' : 'Upload and Assign Beat'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}