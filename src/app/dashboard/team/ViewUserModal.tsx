'use client';
import { useState } from 'react'; // useState ko import karein
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// --- Eye aur EyeOff icons ko import karein ---
import { UserCircle, Briefcase, Banknote, Eye, EyeOff } from 'lucide-react';
import { type TeamMember } from './page';
interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: TeamMember | null;
}
// DetailItem component (ye waise hi rahega)
const DetailItem = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-medium text-gray-800 break-words">{value || 'N/A'}</p>
  </div>
);
// --- NAYA COMPONENT: Password ko show/hide karne ke liye ---
const PasswordDetailItem = ({ label, value }: { label: string; value: string | undefined }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="flex items-center gap-2">
        <p className="font-medium text-gray-800 break-all">
          {showPassword ? (value || 'N/A') : '••••••••'}
        </p>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
export function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
  if (!user) {
    return null;
  }
  const getStatusBadge = (status: number) => {
    if (status === 1) return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    if (status === 0) return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    return <Badge variant="destructive">Deactivated</Badge>;
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{user.name}</DialogTitle>
          <DialogDescription>
            Role: <span className="font-semibold">{user.roleName}</span> | Status: {getStatusBadge(user.status)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          
          <div>
            <h3 className="font-semibold text-lg flex items-center mb-3 border-b pb-2">
              <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
              Professional Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label="Username / Login ID" value={user.username} />
              {/* --- YAHAN PASSWORD DIKHAYEIN --- */}
              <PasswordDetailItem label="Password" value={user.password} />
              <DetailItem label="Assigned Area" value={user.assignedArea} />
              {user.roleName === 'Executive' && (
                <DetailItem label="Assigned ASM" value={user.managerName} />
              )}
              <DetailItem label="TA Rate (per KM)" value={`₹${user.taRatePerKm}`} />
              <DetailItem label="DA Amount" value={`₹${user.daAmount}`} />
            </div>
          </div>
          {/* ... (Personal & Bank Details waise hi rahenge) ... */}
          <div>
            <h3 className="font-semibold text-lg flex items-center mb-3 border-b pb-2">
              <UserCircle className="h-5 w-5 mr-2 text-blue-600" />
              Personal & Contact Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label="Contact Number" value={user.mobileNumber} />
              <DetailItem label="Alternate Phone" value={user.alternatePhone} />
              <DetailItem label="Date of Birth" value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'} />
              <DetailItem label="Aadhar Number" value={user.aadharNumber} />
              <DetailItem label="PAN Number" value={user.panNumber} />
              <div className="sm:col-span-2 lg:col-span-3">
                <DetailItem label="Home Address" value={user.address} />
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg flex items-center mb-3 border-b pb-2">
              <Banknote className="h-5 w-5 mr-2 text-blue-600" />
              Bank Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem label="Account Holder Name" value={user.accountHolderName} />
              <DetailItem label="Bank Name" value={user.bankName} />
              <DetailItem label="Account Number" value={user.bankAccountNumber} />
              <DetailItem label="IFSC Code" value={user.ifscCode} />
              <DetailItem label="Bank Branch" value={user.bankBranch} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}