// src/app/dashboard/dispatch/BulkUploadModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Upload, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '@/services/api';

interface Salesman { id: number; name: string; roleName: string; }
interface ParsedItem { bookId: number; bookTitle: string; quantity: number;unitPrice: number;
  amount: number; }
interface PreviewData {
  successItems: ParsedItem[];
  errorMessages: string[];
  totalItemsFound: number;
}
interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [transportCompanyName, setTransportCompanyName] = useState('');
  const [biltyNumber, setBiltyNumber] = useState('');
  const [dispatchDate, setDispatchDate] = useState<Date | undefined>(new Date());
  const [salesExecutiveId, setSalesExecutiveId] = useState('');
  const [file, setFile] = useState<File | null>(null);
   const [biltyFile, setBiltyFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState('');
  const [errorList, setErrorList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
 const totalAmount = previewData?.successItems.reduce((sum, item) => sum + item.amount, 0) || 0;
  useEffect(() => {
    if (isOpen) {
      const fetchSalesmen = async () => {
        try {
          const response = await api.get('/executives');
          setSalesmen(response.data.filter((s: Salesman) => s.roleName === 'Executive'));
        } catch (err) {
          console.error("Failed to fetch salesmen", err);
        }
      };
      fetchSalesmen();
    } else {
      // Reset form on close
      setError('');
      setErrorList([]);
      setFile(null);
       setBiltyFile(null); 
    }
  }, [isOpen]);
  
  const handlePreview = async () => {
    if (!file) {
      alert("Please select a file to preview.");
      return;
    }
    setIsLoading(true);
    setError(''); // Clear previous errors
    setErrorList([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/consignments/smart-preview', formData);
      setPreviewData(response.data);
      setStep('preview'); // On success, move to the preview step
    } catch (error) {
      console.error("Failed to process file for preview:", error);
      alert("Failed to process file. Please ensure it is a valid .xlsx file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndCreate = async () => {
    if (!file) {
  alert("Excel file is missing. Please go back and re-select the file.");
  setStep('upload'); // User ko wapas upload step par bhej dein
  return;
}
if (!salesExecutiveId || !transportCompanyName || !biltyNumber || !dispatchDate) {
  alert("Missing required information. Please go back and fill all fields.");
  setStep('upload'); // User ko wapas upload step par bhej dein
  return;
}
    setIsLoading(true);
    setError('');
    setErrorList([]);

    const formData = new FormData();
    formData.append('TransportCompanyName', transportCompanyName);
    formData.append('BiltyNumber', biltyNumber);
    formData.append('DispatchDate', dispatchDate.toISOString());
    formData.append('SalesExecutiveId', salesExecutiveId);
    if (file) {
      formData.append('File', file);
    }

    // 'BiltyBillFile' key DTO me capital 'B' se shuru hoti hai
    if (biltyFile) {
      formData.append('BiltyBillFile', biltyFile);
    }
    try {
      // Call the final "smart-upload" endpoint
      const response = await api.post('/consignments/smart-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(response.data.message);
      onSuccess();
      onClose();
    } catch (err: any) {
      // Handle detailed errors from the backend
      if (err.response?.data?.errors) {
        setError(err.response.data.message);
        setErrorList(err.response.data.errors);
        setStep('preview'); // Show the errors on the preview screen
      } else {
        setError(err.response?.data?.message || "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
};
return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl"> {/* Made the modal wider for the table */}
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Upload className="h-6 w-6 mr-2" />
            Upload Consignment from File
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with 'BookID', 'Quantity', and 'Rate' columns.
            <a 
              href={`${process.env.NEXT_PUBLIC_API_URL}/consignments/template`}
              className="text-blue-600 hover:underline ml-2 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Template
            </a>
          </DialogDescription>
        </DialogHeader>

        {/* --- STEP 1: UPLOAD FORM --- */}
        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transport">Transport Company</Label>
                <Input id="transport" value={transportCompanyName} onChange={(e) => setTransportCompanyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bilty">Bilty Number</Label>
                <Input id="bilty" value={biltyNumber} onChange={(e) => setBiltyNumber(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dispatch Date</Label>
                <DatePicker date={dispatchDate} onSelect={setDispatchDate} />
              </div>
              <div className="space-y-2">
                <Label>Assign to Salesman</Label>
                <Select value={salesExecutiveId} onValueChange={setSalesExecutiveId}>
                  <SelectTrigger><SelectValue placeholder="Select salesman" /></SelectTrigger>
                  <SelectContent>{salesmen.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-upload">Consignment File (.xlsx)</Label>
              <Input id="file-upload" type="file" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
  <Label htmlFor="bilty-file-upload">Bilty Bill Photo/PDF (Optional)</Label>
  <Input 
    id="bilty-file-upload" 
    type="file" 
    accept="image/*,application/pdf" 
    onChange={(e) => setBiltyFile(e.target.files?.[0] || null)} 
  />
</div>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handlePreview} disabled={isLoading || !file}>
                {isLoading ? 'Analyzing File...' : 'Preview Consignment'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* --- STEP 2: PREVIEW SCREEN (UPDATED) --- */}
        {step === 'preview' && previewData && (
          <div className="space-y-4 py-4">
            <h3 className="font-semibold text-lg">Consignment Preview</h3>
            <p className="text-sm text-gray-600">Found {previewData.totalItemsFound} items in the file. Please review before creating.</p>
            
            {/* Error List */}
            {previewData.errorMessages.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-md">
                <h4 className="font-bold text-red-800 flex items-center"><AlertTriangle className="h-5 w-5 mr-2" />{previewData.errorMessages.length} Errors Found</h4>
                <ul className="list-disc list-inside text-sm text-red-700 mt-2 max-h-24 overflow-y-auto pr-2">
                  {previewData.errorMessages.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {/* Success List */}
            {previewData.successItems.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-300 rounded-md">
                <h4 className="font-bold text-green-800 flex items-center"><CheckCircle className="h-5 w-5 mr-2" />{previewData.successItems.length} Valid Items</h4>
                <div className="mt-2 max-h-64 overflow-y-auto pr-2">
                  <table className="w-full text-sm">
                    <thead className="text-gray-600">
                      <tr className="border-b">
                        <th className="p-2 text-left font-medium">Book Title</th>
                        <th className="p-2 text-right font-medium">Quantity</th>
                        <th className="p-2 text-right font-medium">Rate</th>
                        <th className="p-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.successItems.map(item => (
                        <tr key={item.bookId} className="border-b">
                          <td className="p-2">{item.bookTitle}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-semibold">₹{item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Total Amount */}
                <div className="flex justify-end mt-2 pt-2 border-t">
                  <p className="font-bold text-base">Total Consignment Value: <span className="text-blue-600">₹{totalAmount.toFixed(2)}</span></p>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={handleConfirmAndCreate} disabled={isLoading || previewData.successItems.length === 0}>
                {isLoading ? 'Creating Consignment...' : <><Send className="h-4 w-4 mr-2" /> Confirm & Create</>}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );}
 