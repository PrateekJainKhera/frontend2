'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import api from '@/services/api';
interface Book { id: number; title: string; subject: string; classLevel: string; medium: string | null; isGift: boolean; unitPrice: number; }
interface AddEditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingBook: Book | null;
}
export function AddEditBookModal({ isOpen, onClose, onSuccess, editingBook }: AddEditBookModalProps) {
  const [formData, setFormData] = useState({ title: '', subject: '', classLevel: '', medium: '', isGift: false, unitPrice: 0 });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = editingBook !== null;
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingBook) {
        setFormData({
          title: editingBook.title,
          subject: editingBook.subject,
          classLevel: editingBook.classLevel,
          medium: editingBook.medium || '',
          isGift: editingBook.isGift,
          unitPrice: editingBook.unitPrice,
        });
      } else {
        setFormData({ title: '', subject: '', classLevel: '', medium: '', isGift: false, unitPrice: 0 });
      }
      setError('');
    }
  }, [isOpen, editingBook, isEditMode]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSelectChange = (name: 'classLevel' | 'medium', value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (isEditMode && editingBook) {
       // await api.put(`/books/${editingBook.id}`, formData);
               await api.post(`/books/${editingBook.id}/update`, formData);

      } else {
        await api.post('/books', formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} book.`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEditMode ? 'Edit Book' : 'Add New Book'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Book Title</Label><Input name="title" value={formData.title} onChange={handleChange} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Class</Label><Input name="classLevel" value={formData.classLevel} onChange={handleChange} placeholder="e.g., Class 5" /></div>
            <div className="space-y-2"><Label>Subject</Label><Input name="subject" value={formData.subject} onChange={handleChange} placeholder="e.g., Science" /></div>
          </div>
          <div className="space-y-2">
            <Label>Medium</Label>
            <Select value={formData.medium} onValueChange={(val) => handleSelectChange('medium', val)}>
                <SelectTrigger><SelectValue placeholder="Select Medium" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Hindi Medium">Hindi Medium</SelectItem>
                    <SelectItem value="English Medium">English Medium</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Unit Price (₹)</Label>
            <Input
              name="unitPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.unitPrice}
              onChange={(e) => setFormData(p => ({...p, unitPrice: parseFloat(e.target.value) || 0}))}
              placeholder="Enter unit price"
            />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <Label>Is this a promotional gift item?</Label>
            <Switch checked={formData.isGift} onCheckedChange={(checked) => setFormData(p => ({...p, isGift: checked}))} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Book'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


