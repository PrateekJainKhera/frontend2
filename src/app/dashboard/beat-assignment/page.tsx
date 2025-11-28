// src/app/dashboard/beat-assignment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Search } from 'lucide-react';
import api from '@/services/api';
import { Label } from '@radix-ui/react-label';

// --- Interfaces ---
interface Executive { id: number; name: string; }
interface Location { id: number; name: string; type: number; }
interface AssignedLocation { locationId: number; locationType: number; name: string; }

export default function BeatAssignmentPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [assignedLocations, setAssignedLocations] = useState<AssignedLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch executives and all locations on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [execRes, locRes] = await Promise.all([
          api.get('/executives'),
          api.get('/locations/all')
        ]);
        setExecutives(execRes.data.filter((e: any) => e.roleName === 'Executive'));
        setAllLocations(locRes.data);
      } catch (error) { console.error("Failed to fetch initial data:", error); }
    };
    fetchData();
  }, []);

  // Fetch the assigned beat when an executive is selected
  useEffect(() => {
    if (!selectedExecutiveId) {
      setAssignedLocations([]);
      return;
    }
    const fetchAssignedBeat = async () => {
      try {
        // For now, we'll assume planning for the current month
        const month = new Date().toISOString();
        const response = await api.get(`/monthly-beat?executiveId=${selectedExecutiveId}&month=${month}`);
        setAssignedLocations(response.data);
      } catch (error) {
        console.error("Failed to fetch assigned beat:", error);
        setAssignedLocations([]);
      }
    };
    fetchAssignedBeat();
  }, [selectedExecutiveId]);

  const handleAssign = (location: Location) => {
    if (!assignedLocations.some(al => al.locationId === location.id && al.locationType === location.type)) {
      setAssignedLocations(prev => [...prev, { locationId: location.id, locationType: location.type, name: location.name }]);
    }
  };

  const handleRemove = (location: AssignedLocation) => {
    setAssignedLocations(prev => prev.filter(al => !(al.locationId === location.locationId && al.locationType === location.locationType)));
  };

  const handleSaveChanges = async () => {
    if (!selectedExecutiveId) return;
    setIsLoading(true);
    try {
      const payload = {
        salesExecutiveId: parseInt(selectedExecutiveId),
        assignedMonth: new Date().toISOString(),
        locations: assignedLocations.map(al => ({ locationId: al.locationId, locationType: al.locationType }))
      };
      await api.post('/monthly-beat', payload);
      alert("Monthly beat plan saved successfully!");
    } catch (error) {
      alert("Failed to save beat plan.");
    } finally {
      setIsLoading(false);
    }
  };

  const availableLocations = allLocations.filter(loc => 
    !assignedLocations.some(al => al.locationId === loc.id && al.locationType === loc.type) &&
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Monthly Beat Assignment</h2>
      <Card>
        <CardContent className="p-4 flex items-end gap-4">
          <div className="flex-1">
            <Label>Select Executive</Label>
            <Select value={selectedExecutiveId} onValueChange={setSelectedExecutiveId}>
              <SelectTrigger><SelectValue placeholder="Select an executive..." /></SelectTrigger>
              <SelectContent>{executives.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveChanges} disabled={isLoading || !selectedExecutiveId}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Panel: Available Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Available Locations</CardTitle>
            <div className="relative pt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input placeholder="Search available..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
            </div>
          </CardHeader>
          <CardContent className="h-96 overflow-y-auto">
            <div className="space-y-2">
              {availableLocations.map(loc => (
                <div key={`${loc.type}-${loc.id}`} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <span>{loc.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleAssign(loc)}><ArrowRight className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Assigned Locations */}
        <Card>
          <CardHeader><CardTitle>Assigned Beat ({assignedLocations.length} locations)</CardTitle></CardHeader>
          <CardContent className="h-96 overflow-y-auto">
            <div className="space-y-2">
              {assignedLocations.map(loc => (
                <div key={`${loc.locationType}-${loc.locationId}`} className="flex items-center justify-between p-2 rounded bg-blue-50">
                  <span>{loc.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(loc)}><ArrowLeft className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}