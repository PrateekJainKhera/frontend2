// src/app/dashboard/expenses/AddExpenseModal.tsx
'use client';
import { useState, useRef, } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { Upload, DollarSign, FileText, Camera, X, Check, IndianRupee, IndianRupeeIcon } from 'lucide-react';
interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
const expenseTypes = [
  { value: '2', label: 'अन्य खर्च (Other Expense)', icon: ':briefcase:' },
];
export function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const { user } = useAuthContext();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseType, setExpenseType] = useState('2');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formatIndianCurrency = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };
  const resetForm = () => {
    setAmount('');
    setDescription('');
    setExpenseType('2');
    setBillFile(null);
    setError('');
    setSuccess(false);
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setBillFile(event.target.files[0]);
      setError('');
    }
  };
  const removeFile = () => {
    setBillFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const handleSubmit = async () => {
    if (!user || !amount || !description || !billFile) {
      setError('कृपया सभी फील्ड भरें और बिल की फोटो अपलोड करें।');
      return;
    }
    if (parseFloat(amount) <= 0) {
      setError('राशि 0 से अधिक होनी चाहिए।');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('SalesExecutiveId', user.id.toString());
      formData.append('Type', expenseType);
      formData.append('Amount', amount);
      formData.append('Description', description);
      formData.append('ExpenseDate', new Date().toISOString());
      formData.append('BillFile', billFile);
      await api.post('/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 1200);
    } catch (err) {
      console.error('Expense submission failed:', err);
      setError('खर्च सबमिट करने में विफल। कृपया पुनः प्रयास करें।');
    } finally {
      setIsLoading(false);
    }
  };
  const handleClose = () => {
    if (!isLoading) {
      onClose();
      resetForm();
    }
  };
  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm mx-auto p-6">
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">खर्च जोड़ा गया!</h3>
            <p className="text-sm text-gray-500">आपका खर्च सफलतापूर्वक सबमिट हो गया।</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto p-4">
        <DialogHeader className="text-center pb-3">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center mx-auto mb-2">
  <IndianRupeeIcon className="h-5 w-5 text-white" />
</div>
          <DialogTitle className="text-base font-bold text-gray-900">नया खर्च जोड़ें</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Expense Type & Amount in Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">प्रकार</Label>
              <Select value={expenseType} onValueChange={setExpenseType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-xs">
                      <div className="flex items-center space-x-1">
                        {/* <span>{type.icon}</span> */}
                        <span>अन्य</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">राशि (₹)</Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="pl-6 h-9 text-sm"
                  step="0.01"
                  min="0"
                />
              </div>
              {amount && (
                <p className="text-xs text-green-600 font-medium">
                  {formatIndianCurrency(amount)}
                </p>
              )}
            </div>
          </div>
          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-700">विवरण</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="जैसे: बाइक पंचर रिपेयर, डिनर बिल..."
              className="min-h-[60px] text-sm resize-none"
              maxLength={150}
            />
            <div className="text-right">
              <span className="text-xs text-gray-400">{description.length}/150</span>
            </div>
          </div>
          {/* Bill Upload - Compact */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-700">बिल फोटो *</Label>
            {!billFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-600">फोटो अपलोड करें</p>
                <p className="text-xs text-gray-400">JPG, PNG (10MB तक)</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs font-medium text-gray-800 truncate max-w-[120px]">
                        {billFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(billFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-6 w-6 p-0 hover:bg-red-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </div>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 pt-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 h-9 text-sm"
          >
            रद्द करें
          </Button>
          <Button
  onClick={handleSubmit}
  disabled={isLoading || !amount || !description || !billFile}
  className="flex-1 h-9 text-sm bg-black hover:bg-gray-800 text-white flex items-center justify-center"
>
  {isLoading ? (
    <div className="flex items-center">
      <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-700 border-t-white mr-2"></div>
      जमा कर रहे...
    </div>
  ) : (
    'खर्च जमा करें'
  )}
</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}