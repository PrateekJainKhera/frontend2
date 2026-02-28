// src/app/dashboard/reports/VisitDetailModal.tsx
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, User, Calendar, Camera, MessageSquare, Users, BookOpen, ShoppingCart, Check, X, ZoomIn } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useState } from 'react';

// Image base URL (hosted on ngrok/Linux server, different from API base URL)
const IMAGE_BASE_URL = 'https://gph.indusanalytics.co.in';
// Backend ke DTO se match karta hua TypeScript interface
interface VisitDetailReport {
  visitId: number;
  executiveName: string;
  visitTimestamp: string;
  locationName: string;
  locationType: string;
  checkInPhotoUrl: string | null;
  latitude: number;
  longitude: number;
  contactPersonLabel: string | null;
  contactPersonName: string | null;
  contactPersonMobile: string | null;
  principalRemarks: string | null;
  permissionToMeetTeachers: boolean;
  locationVisitCount: number;
  teacherInteractions: {
    teacherName: string;
    primarySubject: string | null;
    classesTaught: string | null;
    whatsAppNumber: string | null;
    distributedBooks: { bookTitle: string; quantity: number; wasRecommended: boolean; }[];
    placedOrders: { bookTitle: string; quantity: number; }[];
  }[];
}
interface VisitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitData: VisitDetailReport | null;
  isLoading: boolean;
}
export function VisitDetailModal({ isOpen, onClose, visitData, isLoading }: VisitDetailModalProps) {
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Visit 360° Details</DialogTitle>
            {visitData && (
              <DialogDescription>
                A complete overview of the visit to <strong>{visitData.locationName}</strong> by <strong>{visitData.executiveName}</strong>.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
            {isLoading ? (
              <div className="text-center py-20">Loading visit details...</div>
            ) : !visitData ? (
              <div className="text-center py-20 text-red-500">Could not load visit details.</div>
            ) : (

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-b pb-4">
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" /><span>{visitData.executiveName}</span></div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{visitData.locationName}</span>
                    {visitData.locationVisitCount > 1 && (
                      <Badge variant="secondary" className="ml-2">
                        Visit #{visitData.locationVisitCount}
                      </Badge>
                    )}
                    {visitData.locationVisitCount === 1 && (
                      <Badge variant="default" className="ml-2 bg-green-500">
                        First Visit
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-500" /><span>{new Date(visitData.visitTimestamp).toLocaleString('en-IN')}</span></div>
                </div>
                {/* --- NAYA TWO-COLUMN LAYOUT (PHOTO + PRINCIPAL) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Check-in Photo */}
                  <div className="lg:col-span-1">
                    {visitData.checkInPhotoUrl && (
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center"><Camera className="h-4 w-4 mr-2" />Check-in Photo</h4>
                        <button
                          onClick={() => setIsPhotoPreviewOpen(true)}
                          className="relative w-full aspect-square rounded-md overflow-hidden cursor-pointer group border"
                        >
                          <img
                            src={`${IMAGE_BASE_URL}/${visitData.checkInPhotoUrl.replace(/\\/g, '/')}`}
                            alt="Check-in thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn className="text-white h-8 w-8" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Right Column: Principal's Interaction */}
                  <div className="lg:col-span-2">
                    <div className="space-y-2 h-full flex flex-col">
                      <h4 className="font-semibold flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {visitData.contactPersonLabel || 'Primary Contact'}'s Interaction
                      </h4>
                      <div className="p-4 bg-gray-50 rounded-md border space-y-2 text-sm grow">
                        {visitData.contactPersonName ? (
                          <p><strong>Name:</strong> {visitData.contactPersonName}</p>
                        ) : (
                          <p className="text-gray-500">No contact name recorded.</p>
                        )}
                        {visitData.contactPersonMobile && <p><strong>Mobile:</strong> {visitData.contactPersonMobile}</p>}
                        {visitData.principalRemarks && <p><strong>Remarks:</strong> {visitData.principalRemarks}</p>}
                      </div>
                    </div>
                  </div>
                </div>
                {/* --- NAYA FULL-WIDTH TEACHER SECTION --- */}
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-semibold flex items-center"><Users className="h-4 w-4 mr-2" />Teacher Interactions</h4>
                  {visitData.teacherInteractions.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {visitData.teacherInteractions.map((interaction, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                          <AccordionTrigger>{interaction.teacherName}</AccordionTrigger>
                          <AccordionContent className="space-y-3">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                              {interaction.primarySubject && <Badge variant="outline">Subject: {interaction.primarySubject}</Badge>}
                              {interaction.classesTaught && <Badge variant="outline">Class: {interaction.classesTaught}</Badge>}
                              {interaction.whatsAppNumber && <Badge variant="outline">WhatsApp: {interaction.whatsAppNumber}</Badge>}
                            </div>
                            {interaction.distributedBooks.length > 0 && (
                              <div>
                                <h5 className="font-medium text-xs mb-1 flex items-center"><BookOpen className="h-3 w-3 mr-1.5" />Specimens Given</h5>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  {interaction.distributedBooks.map((book, i) => (
                                    <li key={i} className="flex justify-between">
                                      <span>{book.bookTitle}</span>
                                      <Badge variant="secondary">Qty: {book.quantity}</Badge>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {interaction.placedOrders.length > 0 && (
                              <div>
                                <h5 className="font-medium text-xs mb-1 flex items-center"><ShoppingCart className="h-3 w-3 mr-1.5" />Orders Placed</h5>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                  {interaction.placedOrders.map((order, i) => (
                                    <li key={i} className="flex justify-between">
                                      <span>{order.bookTitle}</span>
                                      <Badge>Qty: {order.quantity}</Badge>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-md border flex items-center justify-center">
                      <p className="text-sm text-gray-500">No teacher interactions were recorded for this visit.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>
      <Dialog open={isPhotoPreviewOpen} onOpenChange={setIsPhotoPreviewOpen}>
        <DialogContent className="max-w-4xl p-2">
          {/* === YEH HAI FIX: Header aur Title add karein === */}
          <DialogHeader className="sr-only">
            <DialogTitle>Check-in Photo Preview</DialogTitle>
            <DialogDescription>
              A full-size view of the check-in photo for the visit to {visitData?.locationName}.
            </DialogDescription>
          </DialogHeader>
          {/* === END FIX === */}
          <a
            href={visitData?.checkInPhotoUrl ? `${IMAGE_BASE_URL}/${visitData.checkInPhotoUrl.replace(/\\/g, '/')}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            title="Open image in new tab to zoom"
          >
            <img
              src={visitData?.checkInPhotoUrl ? `${IMAGE_BASE_URL}/${visitData.checkInPhotoUrl.replace(/\\/g, '/')}` : ''}
              alt="Check-in full preview"
              className="w-full h-auto rounded-md"
            />
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
}

