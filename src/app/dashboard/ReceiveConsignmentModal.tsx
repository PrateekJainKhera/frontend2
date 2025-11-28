// src/app/dashboard/ReceiveConsignmentModal.tsx
'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import api from '@/services/api';
import { Consignment } from '@/types';

interface ReceiveConsignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  consignment: Consignment | null;
}

export function ReceiveConsignmentModal({ isOpen, onClose, onSuccess, consignment }: ReceiveConsignmentModalProps) {
  const [freightCost, setFreightCost] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReceive = async () => {
    if (!consignment || !freightCost) {
      alert("Please enter the freight cost.");
      return;
    }
    setIsLoading(true);
    
    // The payload is now a simple JSON object
    const payload = {
      FreightCost: parseFloat(freightCost)
    };

    try {
      // The request is now a standard JSON request
      await api.post(`/consignments/${consignment.id}/receive`, payload);
      alert("Consignment received successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      alert("Failed to receive consignment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Receive Consignment from {consignment?.transportCompanyName}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="freight">Freight Cost (₹)</Label>
            <Input id="freight" type="number" value={freightCost} onChange={(e) => setFreightCost(e.target.value)} />
          </div>
          {/* --- PHOTO UPLOAD SECTION IS REMOVED --- */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleReceive} disabled={isLoading}>
            {isLoading ? 'Processing...' : <><Check className="h-4 w-4 mr-2" /> Confirm Receipt</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}