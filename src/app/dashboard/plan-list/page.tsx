// src/app/dashboard/plan-list/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, Map, Search, Send, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Building2, Store, UserSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// --- Interfaces ---
interface AssignedLocation {
  id: number; // This is the master location ID (or 0 if not found)
  name: string;
  type: number;
  hasCoordinates: boolean;
}
interface SelectedLocation {
  locationId: number;
  locationType: number;
}

export default function ListPlanningPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [allAssigned, setAllAssigned] = useState<AssignedLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<AssignedLocation[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocation[]>([]);
  const [planDate, setPlanDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getLocationIcon = (type: number) => {
    switch (type) {
      case 1: return <UserSquare className="h-5 w-5 text-purple-500" />;
      case 2: return <Store className="h-5 w-5 text-green-500" />;
      default: return <Building2 className="h-5 w-5 text-blue-500" />;
    }
  };

  useEffect(() => {
    if (user) {
      const fetchAssignments = async () => {
        try {
          const response = await api.get('/beat-assignments/my-assignments');
          setAllAssigned(response.data);
          setFilteredLocations(response.data);
        } catch (error) {
          console.error("Failed to fetch assigned locations:", error);
        }
      };
      fetchAssignments();
    }
  }, [user]);

  useEffect(() => {
    setFilteredLocations(
      allAssigned.filter(loc => loc.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, allAssigned]);

  const handleSelect = (location: AssignedLocation, isSelected: boolean) => {
    if (isSelected) {
      // Only allow selection if the location has been verified (has a master ID)
      if (location.id === 0) {
        alert("This location has not been verified yet and cannot be added to a plan. Please perform a Quick Visit first to verify its location.");
        return;
      }
      setSelectedLocations(prev => [...prev, { locationId: location.id, locationType: location.type }]);
    } else {
      setSelectedLocations(prev => prev.filter(l => l.locationId !== location.id));
    }
  };

  const handleCreatePlan = async () => {
    if (!user || selectedLocations.length === 0 || !planDate) {
      alert("Please select a date and at least one location.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        salesExecutiveId: user.id,
        planDate: planDate.toISOString(),
        locations: selectedLocations,
      };
      await api.post('/beatplans', payload);
      alert("Plan created successfully!");
      router.push('/dashboard');
    } catch (error) {
      alert("Failed to create plan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Create Beat Plan</h2>
        <Button variant="outline" onClick={() => router.push('/dashboard/plan/map')}>
          <Map className="h-4 w-4 mr-2" />
          View on Map
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label>Plan Date</Label>
              <DatePicker date={planDate} onSelect={setPlanDate} />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Search Locations</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input placeholder="Search your assigned locations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Select Locations to Visit</CardTitle></CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {filteredLocations.map(loc => (
              <div key={`${loc.type}-${loc.id || loc.name}`} className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-50">
                <Checkbox
                  id={`loc-${loc.id || loc.name}`}
                  onCheckedChange={(checked) => handleSelect(loc, checked as boolean)}
                  disabled={loc.id === 0} // Disable checkbox for unverified locations
                />
                <div className="flex-shrink-0">{getLocationIcon(loc.type)}</div>
                <Label htmlFor={`loc-${loc.id || loc.name}`} className={`flex-1 cursor-pointer ${loc.id === 0 ? 'cursor-not-allowed text-gray-400' : ''}`}>{loc.name}</Label>
                {!loc.hasCoordinates && (
                  <Badge variant="destructive" className="flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Verified
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleCreatePlan} disabled={isLoading || selectedLocations.length === 0} className="w-full text-lg py-6">
        <Send className="h-5 w-5 mr-2" />
        {isLoading ? 'Saving Plan...' : `Create Plan with ${selectedLocations.length} Visits`}
      </Button>
    </div>
  );
}