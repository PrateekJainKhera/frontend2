// src/app/dashboard/plan/map/SelectionSheet.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, X, Building2, Store, UserSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext'; // ADD THIS

export interface SelectedLocationForSheet {
  uniqueKey: string;
  displayName: string;
  locationType: number;
}

interface SelectionSheetProps {
  selectedLocations: SelectedLocationForSheet[];
  onRemove: (location: SelectedLocationForSheet) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function SelectionSheet({ selectedLocations, onRemove, onConfirm, isLoading }: SelectionSheetProps) {
  const { t } = useLanguage(); // ADD THIS
  
  if (selectedLocations.length === 0) {
    return null;
  }

  const schoolCount = selectedLocations.filter(l => l.locationType === 0).length;
  const coachingCount = selectedLocations.filter(l => l.locationType === 1).length;
  const shopkeeperCount = selectedLocations.filter(l => l.locationType === 2).length;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 p-2 sm:p-4">
      <Card className="max-w-4xl mx-auto shadow-2xl">
        <CardHeader className="p-4">
          <CardTitle className="text-xl">
            {selectedLocations.length} {t('planMap.locationsSelected')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
            <div className={`p-2 rounded font-medium ${schoolCount >= 4 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
              <Building2 className="h-6 w-6 mx-auto mb-1" />
              {t('planMap.schools')}: {schoolCount}/4
            </div>
            <div className={`p-2 rounded font-medium ${coachingCount >= 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
              <UserSquare className="h-6 w-6 mx-auto mb-1" />
              {t('planMap.coaching')}: {coachingCount}/1
            </div>
            <div className={`p-2 rounded font-medium ${shopkeeperCount >= 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
              <Store className="h-6 w-6 mx-auto mb-1" />
              {t('planMap.shops')}: {shopkeeperCount}/1
            </div>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto mb-4 pr-2">
            {selectedLocations.map(loc => (
              <div key={loc.uniqueKey} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <School className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="truncate text-base">{loc.displayName}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => onRemove(loc)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
          <Button className="w-full h-14 text-lg" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('planMap.adding') : t('planMap.addVisits').replace('{count}', selectedLocations.length.toString())}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}