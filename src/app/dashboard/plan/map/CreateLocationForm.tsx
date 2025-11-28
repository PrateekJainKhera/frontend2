// src/app/dashboard/plan/map/CreateLocationForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Mic } from 'lucide-react';

interface CreateLocationFormProps {
  onConfirm: (name: string, type: number) => void;
  onClose: () => void;
  coordinates: { lat: number; lng: number };
}

export function CreateLocationForm({ onConfirm, onClose, coordinates }: CreateLocationFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('0');

  const handleConfirm = () => {
    if (!name) { alert("Please enter a name."); return; }
    onConfirm(name, parseInt(type));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center font-semibold">
        <MapPin className="h-5 w-5 mr-2" />
        Add New Location to Plan
      </div>
      <p className="text-sm text-gray-600">
        A new location will be created at: <br />
        <strong>Lat:</strong> {coordinates.lat.toFixed(5)}, <strong>Lng:</strong> {coordinates.lng.toFixed(5)}
      </p>
      <div className="space-y-2">
        <Label htmlFor="location-name">Location Name *</Label>
        <div className="relative">
          <Input id="location-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Speak or type the name..." className="pr-10" />
          <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8">
            <Mic className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Location Type *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">School</SelectItem>
            <SelectItem value="1">Coaching Center</SelectItem>
            <SelectItem value="2">Shopkeeper</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm}>Add to Plan</Button>
      </div>
    </div>
  );
}