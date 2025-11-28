'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { UserPlus, Pencil } from 'lucide-react';
import api from '@/services/api';
// Interface ko update karein taaki saari nayi fields aa jayein
interface TeamMember {
  id: number;
  name: string;
  username: string;
  roleId: number;
  roleName: string;
  address: string | null;
  assignedArea: string | null;
  mobileNumber: string;
  status: number;
  taRatePerKm: number;
  daAmount: number;
  managerId: number | null;
  // Nayi fields
  dateOfBirth: string | null;
  alternatePhone: string | null;
  aadharNumber: string | null;
  panNumber: string | null;
  accountHolderName: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankBranch: string | null;
  ifscCode: string | null;
}
interface AddEditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser: TeamMember | null;
  currentUserRole: string;
}
export function AddEditUserModal({ isOpen, onClose, onSuccess, editingUser, currentUserRole }: AddEditUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    address: '',
    roleId: '3',
    assignedArea: '',
    username: '',
    password: '',
    confirmPassword: '',
    taRatePerKm: '2.0',
    daAmount: '300.0',
    managerId: '',
    dateOfBirth: '',
    alternatePhone: '',
    aadharNumber: '',
    panNumber: '',
    accountHolderName: '',
    bankAccountNumber: '',
    reenterBankAccountNumber: '',
    bankName: '',
    bankBranch: '',
    ifscCode: '',
  });
  const [allAsms, setAllAsms] = useState<{ id: number; name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = editingUser !== null;
  useEffect(() => {
    setErrors({});
    setServerError('');
    if (isOpen && currentUserRole === 'Admin') {
      const fetchAsms = async () => {
        try {
          const response = await api.get('/executives');
          setAllAsms(response.data.filter((u: any) => u.roleId === 2));
        } catch (error) { console.error("Failed to fetch ASMs", error); }
      };
      fetchAsms();
    }
    if (isEditMode && editingUser) {
      // --- YEH HAI SABSE ZAROORI FIX ---
      // Saari fields ko `editingUser` se set karein
      setFormData({
        name: editingUser.name || '',
        mobileNumber: editingUser.mobileNumber || '',
        address: editingUser.address || '',
        roleId: editingUser.roleId.toString(),
        assignedArea: editingUser.assignedArea || '',
        username: editingUser.username || '',
        password: '',
        confirmPassword: '',
        managerId: editingUser.managerId?.toString() || '',
        taRatePerKm: editingUser.taRatePerKm.toString(),
        daAmount: editingUser.daAmount.toString(),
        dateOfBirth: editingUser.dateOfBirth ? editingUser.dateOfBirth.split('T')[0] : '',
        alternatePhone: editingUser.alternatePhone || '',
        aadharNumber: editingUser.aadharNumber || '',
        panNumber: editingUser.panNumber || '',
        accountHolderName: editingUser.accountHolderName || '',
        bankAccountNumber: editingUser.bankAccountNumber || '',
        reenterBankAccountNumber: editingUser.bankAccountNumber || '',
        bankName: editingUser.bankName || '',
        bankBranch: editingUser.bankBranch || '',
        ifscCode: editingUser.ifscCode || '',
      });
    } else {
      // Add mode me form reset karein
      setFormData({
        name: '', mobileNumber: '', address: '', roleId: '3',
        assignedArea: '', username: '', password: '', confirmPassword: '',
        taRatePerKm: '2.0', daAmount: '300.0', managerId: '',
        dateOfBirth: '', alternatePhone: '', aadharNumber: '', panNumber: '',
        accountHolderName: '', bankAccountNumber: '', reenterBankAccountNumber: '',
        bankName: '', bankBranch: '', ifscCode: '',
      });
    }
  }, [editingUser, isEditMode, isOpen, currentUserRole]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (['mobileNumber', 'alternatePhone', 'aadharNumber', 'bankAccountNumber', 'reenterBankAccountNumber'].includes(name)) {
      processedValue = value.replace(/[^0-9]/g, '');
    } else if (['panNumber', 'ifscCode'].includes(name)) {
      processedValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  const handleSelectChange = (name: 'roleId' | 'managerId', value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Full Name is required.';
    if (!formData.mobileNumber) newErrors.mobileNumber = 'Contact Number is required.';
    if (!formData.address.trim()) newErrors.address = 'Address is required.';
    if (!formData.assignedArea.trim()) newErrors.assignedArea = 'Assigned Area is required.';
    if (!formData.username.trim()) newErrors.username = 'Username is required.';
    if (!isEditMode) {
      if (!formData.password) newErrors.password = 'Password is required.';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    } else if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
    }
    if (formData.mobileNumber && !/^[6-9]\d{9}$/.test(formData.mobileNumber)) newErrors.mobileNumber = 'Invalid 10-digit mobile number.';
    if (formData.alternatePhone && !/^[6-9]\d{9}$/.test(formData.alternatePhone)) newErrors.alternatePhone = 'Invalid 10-digit mobile number.';
    if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber)) newErrors.aadharNumber = 'Aadhar must be 12 digits.';
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) newErrors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F).';
    if (formData.bankAccountNumber !== formData.reenterBankAccountNumber) newErrors.reenterBankAccountNumber = 'Account numbers do not match.';
    if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) newErrors.ifscCode = 'Invalid IFSC code format.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Form ko submit hone se rokein
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setServerError('');
    try {
      const payload: any = {
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        address: formData.address,
        roleId: parseInt(formData.roleId),
        assignedArea: formData.assignedArea,
        username: formData.username,
        taRatePerKm: parseFloat(formData.taRatePerKm),
        daAmount: parseFloat(formData.daAmount),
        managerId: formData.managerId === 'null' || !formData.managerId ? null : parseInt(formData.managerId),
        dateOfBirth: formData.dateOfBirth || null,
        alternatePhone: formData.alternatePhone || null,
        aadharNumber: formData.aadharNumber || null,
        panNumber: formData.panNumber || null,
        accountHolderName: formData.accountHolderName || null,
        bankAccountNumber: formData.bankAccountNumber || null,
        bankName: formData.bankName || null,
        bankBranch: formData.bankBranch || null,
        ifscCode: formData.ifscCode || null,
      };
      if (formData.password) {
        payload.password = formData.password;
        payload.confirmPassword = formData.confirmPassword;
      }
      if (isEditMode && editingUser) {
        //await api.put(`/executives/${editingUser.id}`, payload);
          await api.post(`/executives/${editingUser.id}/update`, payload); // NEW

      } else {
        await api.post('/executives', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            {isEditMode ? <Pencil className="h-6 w-6 mr-2" /> : <UserPlus className="h-6 w-6 mr-2" />}
            {isEditMode ? 'Edit Team Member' : 'Onboard New Team Member'}
          </DialogTitle>
        </DialogHeader>
           <form onSubmit={handleSubmit} autoComplete="off">
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          
          <h3 className="font-semibold text-lg border-b pb-2">Professional Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="mobileNumber">Contact Number *</Label>
              <Input id="mobileNumber" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} maxLength={10} />
              {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="address">Home Address *</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="assignedArea">Assigned Area / Territory *</Label>
              <Input id="assignedArea" name="assignedArea" value={formData.assignedArea} onChange={handleChange} />
              {errors.assignedArea && <p className="text-red-500 text-xs mt-1">{errors.assignedArea}</p>}
            </div>
            {currentUserRole === 'Admin' && (
              <>
                <div className="space-y-1"><Label>Role *</Label><Select value={formData.roleId} onValueChange={(v) => handleSelectChange('roleId', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3">Executive</SelectItem><SelectItem value="2">ASM</SelectItem><SelectItem value="1">Admin</SelectItem></SelectContent></Select></div>
                <div className="space-y-1"><Label htmlFor="taRatePerKm">TA Rate (per KM) *</Label><Input id="taRatePerKm" name="taRatePerKm" type="number" value={formData.taRatePerKm} onChange={handleChange} /></div>
                <div className="space-y-1"><Label htmlFor="daAmount">DA Amount *</Label><Input id="daAmount" name="daAmount" type="number" value={formData.daAmount} onChange={handleChange} /></div>
                {formData.roleId === '3' && (
                  <div className="space-y-1 md:col-span-2"><Label>Assign to Manager (ASM)</Label><Select value={formData.managerId} onValueChange={(v) => handleSelectChange('managerId', v)}><SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger><SelectContent><SelectItem value="null">No Manager</SelectItem>{allAsms.map(asm => (<SelectItem key={asm.id} value={asm.id.toString()}>{asm.name}</SelectItem>))}</SelectContent></Select></div>
                )}
              </>
            )}
          </div>
          <h3 className="font-semibold text-lg border-b pb-2 pt-4">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1"><Label>Date of Birth</Label><Input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} /></div>
            <div className="space-y-1">
              <Label>Alternate Phone</Label>
              <Input name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} maxLength={10} />
              {errors.alternatePhone && <p className="text-red-500 text-xs mt-1">{errors.alternatePhone}</p>}
            </div>
            <div className="space-y-1">
              <Label>Aadhar Number</Label>
              <Input name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} maxLength={12} />
              {errors.aadharNumber && <p className="text-red-500 text-xs mt-1">{errors.aadharNumber}</p>}
            </div>
            <div className="space-y-1">
              <Label>PAN Number</Label>
              <Input name="panNumber" value={formData.panNumber} onChange={handleChange} maxLength={10} />
              {errors.panNumber && <p className="text-red-500 text-xs mt-1">{errors.panNumber}</p>}
            </div>
          </div>
          <h3 className="font-semibold text-lg border-b pb-2 pt-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Account Holder Name</Label><Input name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} /></div>
            <div className="space-y-1"><Label>Bank Name</Label><Input name="bankName" value={formData.bankName} onChange={handleChange} /></div>
            <div className="space-y-1"><Label>Bank Account Number</Label><Input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} /></div>
            <div className="space-y-1">
              <Label>Re-enter Account Number</Label>
              <Input name="reenterBankAccountNumber" value={formData.reenterBankAccountNumber} onChange={handleChange} />
              {errors.reenterBankAccountNumber && <p className="text-red-500 text-xs mt-1">{errors.reenterBankAccountNumber}</p>}
            </div>
            <div className="space-y-1"><Label>Bank Branch</Label><Input name="bankBranch" value={formData.bankBranch} onChange={handleChange} /></div>
            <div className="space-y-1">
              <Label>IFSC Code</Label>
              <Input name="ifscCode" value={formData.ifscCode} onChange={handleChange} maxLength={11} />
              {errors.ifscCode && <p className="text-red-500 text-xs mt-1">{errors.ifscCode}</p>}
            </div>
          </div>
          <h3 className="font-semibold text-lg border-b pb-2 pt-4">Account Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="username">Username / Login ID *</Label>
              <Input id="username" name="username" value={formData.username} onChange={handleChange} />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">{isEditMode ? 'New Password (Optional)' : 'Password *'}</Label>
  <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} autoComplete="new-password" />   
             {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            {!isEditMode && (
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
 <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" />
                 {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            )}
          </div>
          
          {serverError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md text-center mt-4">{serverError}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
  <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : (isEditMode ? 'Update Account' : 'Create Account')}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}