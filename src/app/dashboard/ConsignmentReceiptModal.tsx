'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle, FileText } from 'lucide-react';
import api from '@/services/api';
import {useState} from 'react';
import { Label } from '@radix-ui/react-label';
import { Input } from '@/components/ui/input';
import { Consignment, ConsignmentItem } from '@/types';
interface ConsignmentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  consignment: Consignment | null;
}
export function ConsignmentReceiptModal({ isOpen, onClose, onSuccess, consignment }: ConsignmentReceiptModalProps) {
  if (!consignment) return null;
   const [freightCost, setFreightCost] = useState('');
  const [biltyBillPhoto, setBiltyBillPhoto] = useState<File | null>(null);
const handleReceiveConfirm = async () => {
  // Confirmation ke liye ek simple `confirm` box use karna aacha idea hai.
  if (!confirm("Are you sure you want to mark this consignment as received? This will update your stock.")) {
    return;
  }
   const formData = new FormData();
  formData.append('FreightCost', freightCost || '0');
  if (biltyBillPhoto) {
    formData.append('BiltyBillPhoto', biltyBillPhoto);
  }

  try {            {/* ... table code ... */}
  
    await api.post(`/consignments/${consignment.id}/receive`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    alert("Consignment received successfully! Your stock has been updated.");
    onSuccess();
    onClose();
  } catch (error) {
    console.error("Failed to receive consignment:", error);
    alert("Error receiving consignment.");
  }
};
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Truck className="h-6 w-6 mr-2" />
            Delivery Challan / Receipt
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Transport Details */}
          <div className="p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
  <div><strong>Transport:</strong> {consignment.transportCompanyName}</div>
  <div><strong>Bilty No:</strong> {consignment.biltyNumber}</div>
  <div className="col-span-2"><strong>Dispatch Date:</strong> {new Date(consignment.dispatchDate).toLocaleDateString('en-IN')}</div>
   {consignment.biltyBillUrl && (
                <div className="col-span-2">
                  <a
                    href={consignment.biltyBillUrl.startsWith('http')
                      ? consignment.biltyBillUrl
                      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${consignment.biltyBillUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:underline font-semibold"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Bilty Bill
                  </a>
                </div>
              )}
</div>
          </div>
          {/* Items Table */}
          <div>
  <h4 className="font-semibold mb-2">Items in this Consignment</h4>
  <div className="border rounded-lg overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Book Details</th>
          <th className="p-2 text-center">Quantity</th>
        </tr>
      </thead>
      <tbody>
        {(consignment.items || []).map((item, index) => (
          <tr key={index} className="border-t">
            <td className="p-2 font-medium">{item.bookTitle}</td>
            <td className="p-2 text-center font-bold">{item.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
 {/* --- ADD THIS ENTIRE BLOCK --- */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="freightCost">Freight Cost Paid (if any)</Label>
              <Input 
                id="freightCost" 
                type="number" 
                value={freightCost} 
                onChange={(e) => setFreightCost(e.target.value)} 
                placeholder="Enter amount in ₹" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biltyBill">Upload Bilty Bill Photo</Label>
              <Input 
                id="biltyBill" 
                type="file" 
                accept="image/*"
                onChange={(e) => setBiltyBillPhoto(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          {/* --- END ADD --- */}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleReceiveConfirm}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm & Receive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

