// src/app/dashboard/reports/LocationVisitHistoryModal.tsx
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Users, BookOpen, ShoppingCart, MessageSquare, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VisitHistoryItem {
  visitId: number;
  visitDate: string;
  executiveName: string;
  teachersInteracted: number;
  booksDistributed: number;
  ordersPlaced: number;
  principalRemarks: string | null;
}

interface LocationVisitHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  visits: VisitHistoryItem[];
  isLoading: boolean;
  onViewDetails: (visitId: number) => void;
}

export function LocationVisitHistoryModal({ 
  isOpen, 
  onClose, 
  locationName, 
  visits, 
  isLoading,
  onViewDetails 
}: LocationVisitHistoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            📍 {locationName} - Visit History
          </DialogTitle>
          <DialogDescription>
            Complete timeline of all visits to this location ({visits.length} total)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="text-center py-20">Loading visit history...</div>
          ) : visits.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No visits found for this location.</div>
          ) : (
            <div className="space-y-4">
              {visits.map((visit, index) => (
                <div 
                  key={visit.visitId} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Visit Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        Visit #{visits.length - index}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(visit.visitDate).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(visit.visitId)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Full Details
                    </Button>
                  </div>

                  {/* Visit Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{visit.executiveName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span>{visit.teachersInteracted} Teachers</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-green-500" />
                      <span>{visit.booksDistributed} Books</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ShoppingCart className="h-4 w-4 text-orange-500" />
                      <span>{visit.ordersPlaced} Orders</span>
                    </div>
                  </div>

                  {/* Principal Remarks */}
                  {visit.principalRemarks && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-700 mb-1">Principal's Remarks:</p>
                          <p className="text-sm text-gray-700">{visit.principalRemarks}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
