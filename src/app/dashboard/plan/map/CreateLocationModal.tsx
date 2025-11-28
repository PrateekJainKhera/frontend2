// src/app/dashboard/plan/map/CreateLocationModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin,Mic,MicOff   } from 'lucide-react';

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, type: number) => void;
  coordinates: { lat: number; lng: number } | null;
}

export function CreateLocationModal({ isOpen, onClose, onConfirm, coordinates }: CreateLocationModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('0'); // Default to School (0)
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setName('');
      setType('0');
    }
  }, [isOpen]);
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setName(transcript); // Set the input field's value
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.start();
    }

    return () => {
      recognition.stop();
    };
  }, [isListening]); // Dependency on isListening


  const handleConfirm = () => {
    if (!name) {
      alert("Please enter a name for the location.");
      return;
    }
    onConfirm(name, parseInt(type));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Add New Location to Plan
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            A new location will be created at your current GPS coordinates: <br />
            <strong>Lat:</strong> {coordinates?.lat.toFixed(5)}, <strong>Lng:</strong> {coordinates?.lng.toFixed(5)}
          </p>
          <div className="space-y-2">
            <Label htmlFor="location-name">Location Name *</Label>
             {/* --- THIS IS THE CHANGE --- */}
            <div className="relative">
              <Input 
                id="location-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Speak or type the name..."
                className="pr-10" // Add padding to the right for the icon
              />
              
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8"
            onClick={() => setIsListening(prev => !prev)}
          >
            {isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5 text-gray-500" />}
          </Button>
        </div>
            {/* <Input id="location-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sharma Maths Classes" /> */}
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Add to Plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}