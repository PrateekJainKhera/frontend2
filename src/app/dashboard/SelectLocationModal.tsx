// src/app/dashboard/SelectLocationModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/services/api';

interface Location { id: number; name: string; }

interface SelectLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (locationId: number) => void;
  locationType: 'shopkeeper' | 'coaching';
}

export function SelectLocationModal({ isOpen, onClose, onSelect, locationType }: SelectLocationModalProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchLocations = async () => {
        const endpoint = locationType === 'shopkeeper' ? '/shopkeepers' : '/coachingcenters';
        try {
          const response = await api.get(endpoint);
          setLocations(response.data);
          setFilteredLocations(response.data);
        } catch (error) {
          console.error(`Failed to fetch ${locationType}s`, error);
        }
      };
      fetchLocations();
    } else {
      // Reset state on close
      setSearchTerm('');
      setIsCreatingNew(false);
      setNewLocationName('');
    }
  }, [isOpen, locationType]);

  useEffect(() => {
    setFilteredLocations(
      locations.filter(loc => loc.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, locations]);

  const handleCreateNew = async () => {
    if (!newLocationName) return;
    const endpoint = locationType === 'shopkeeper' ? '/shopkeepers' : '/coachingcenters';
    try {
      const response = await api.post(endpoint, { name: newLocationName });
      onSelect(response.data.id); // Select the newly created location
    } catch (error) {
      console.error(`Failed to create new ${locationType}`, error);
      alert("Error creating new location.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">Select {locationType}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {!isCreatingNew ? (
            <div className="space-y-4">
              <Input
                placeholder="Search existing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredLocations.map(loc => (
                  <Button key={loc.id} variant="outline" className="w-full justify-start" onClick={() => onSelect(loc.id)}>
                    {loc.name}
                  </Button>
                ))}
              </div>
              <Button variant="secondary" className="w-full" onClick={() => setIsCreatingNew(true)}>
                + Create New {locationType}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Label>New {locationType} Name</Label>
              <Input
                placeholder={`Enter name...`}
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsCreatingNew(false)}>Cancel</Button>
                <Button onClick={handleCreateNew}>Create & Select</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}