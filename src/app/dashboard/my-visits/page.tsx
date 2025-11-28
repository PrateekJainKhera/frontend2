'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Calendar, MapPin, Clock, Users, BookOpen, ShoppingCart,
  Eye, Download, ChevronLeft, ChevronRight, School,
  GraduationCap, Store, CheckCircle, XCircle
} from 'lucide-react';
import api from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Visit {
  visitId: number;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  duration: number | null;
  locationName: string;
  locationType: string;
  area: string | null;
  district: string | null;
  status: string;
  teachersInteracted: number;
  booksDistributed: number;
  ordersPlaced: number;
  permissionGranted: boolean;
  principalRemarks: string | null;
  checkInPhotoUrl: string | null;
  latitude: number;
  longitude: number;
}

interface VisitHistoryResponse {
  visits: Visit[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface VisitDetail {
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
  teacherInteractions: TeacherInteraction[];
}

interface TeacherInteraction {
  teacherName: string;
  primarySubject: string | null;
  classesTaught: string | null;
  whatsAppNumber: string | null;
  distributedBooks: BookDistribution[];
  placedOrders: Order[];
}

interface BookDistribution {
  bookTitle: string;
  quantity: number;
  wasRecommended: boolean;
}

interface Order {
  bookTitle: string;
  quantity: number;
}

export default function MyVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Detail modal
  const [selectedVisit, setSelectedVisit] = useState<VisitDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    fetchVisitHistory();
  }, [pageNumber, startDate, endDate]);

  const fetchVisitHistory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString()
      });

      const response = await api.get<VisitHistoryResponse>(`/reports/my-visit-history?${params.toString()}`);
      setVisits(response.data.visits);
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error("Failed to fetch visit history:", error);
      toast({
        title: "Error",
        description: "Failed to load visit history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVisitDetail = async (visitId: number) => {
    setIsLoadingDetail(true);
    try {
      const response = await api.get<VisitDetail>(`/reports/visit-details/${visitId}`);
      setSelectedVisit(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch visit details:", error);
      toast({
        title: "Error",
        description: "Failed to load visit details.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Date', 'Check-In', 'Check-Out', 'Duration (min)', 'Location',
      'Type', 'Area', 'District', 'Teachers Met', 'Books Distributed',
      'Orders Placed', 'Status'
    ];

    const rows = visits.map(v => [
      format(new Date(v.date), 'dd-MMM-yyyy'),
      v.checkInTime,
      v.checkOutTime || '-',
      v.duration?.toFixed(0) || '-',
      v.locationName,
      v.locationType,
      v.area || '-',
      v.district || '-',
      v.teachersInteracted,
      v.booksDistributed,
      v.ordersPlaced,
      v.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-visits-${startDate}-to-${endDate}.csv`;
    a.click();

    toast({
      title: "Success",
      description: "Visit history exported successfully."
    });
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'School': return <School className="h-4 w-4" />;
      case 'CoachingCenter': return <GraduationCap className="h-4 w-4" />;
      case 'Shopkeeper': return <Store className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getLocationTypeBadge = (type: string) => {
    const colors = {
      School: 'bg-blue-100 text-blue-800',
      CoachingCenter: 'bg-purple-100 text-purple-800',
      Shopkeeper: 'bg-green-100 text-green-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Calculate summary stats
  const summaryStats = {
    totalVisits: totalCount,
    totalTeachers: visits.reduce((sum, v) => sum + v.teachersInteracted, 0),
    totalBooks: visits.reduce((sum, v) => sum + v.booksDistributed, 0),
    totalOrders: visits.reduce((sum, v) => sum + v.ordersPlaced, 0)
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Visit History</h2>
          <p className="text-gray-500">Track all your field visits and activities</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" disabled={visits.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Visits</p>
                <p className="text-2xl font-bold">{summaryStats.totalVisits}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Teachers Met</p>
                <p className="text-2xl font-bold">{summaryStats.totalTeachers}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Books Distributed</p>
                <p className="text-2xl font-bold">{summaryStats.totalBooks}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Orders Placed</p>
                <p className="text-2xl font-bold">{summaryStats.totalOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPageNumber(1);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPageNumber(1);
                }}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={fetchVisitHistory} className="w-full" disabled={isLoading}>
                <Calendar className="h-4 w-4 mr-2" />
                {isLoading ? 'Loading...' : 'Apply Filters'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Visit Details</CardTitle>
              <CardDescription>
                Showing {visits.length} of {totalCount} visits
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Duration</TableHead>
                  <TableHead className="text-center">Teachers</TableHead>
                  <TableHead className="text-center">Books</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading visits...
                    </TableCell>
                  </TableRow>
                ) : visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      No visits found for the selected date range
                    </TableCell>
                  </TableRow>
                ) : (
                  visits.map((visit) => (
                    <TableRow key={visit.visitId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(visit.date), 'dd MMM yyyy')}
                          </span>
                          <span className="text-sm text-gray-500">
                            {visit.checkInTime}
                            {visit.checkOutTime && ` - ${visit.checkOutTime}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{visit.locationName}</span>
                          {visit.area && (
                            <span className="text-sm text-gray-500">{visit.area}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getLocationTypeBadge(visit.locationType)}`}>
                          {getLocationIcon(visit.locationType)}
                          {visit.locationType === 'CoachingCenter' ? 'Coaching' : visit.locationType}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {visit.duration ? (
                          <span className="flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.round(visit.duration)} min
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3 text-gray-500" />
                          {visit.teachersInteracted}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-gray-500" />
                          {visit.booksDistributed}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3 text-gray-500" />
                          {visit.ordersPlaced}
                        </span>
                      </TableCell>
                      <TableCell>
                        {visit.permissionGranted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchVisitDetail(visit.visitId)}
                          disabled={isLoadingDetail}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {pageNumber} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                  disabled={pageNumber === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
                  disabled={pageNumber === totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visit Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedVisit && (
            <>
              <DialogHeader>
                <DialogTitle>Visit Details</DialogTitle>
                <DialogDescription>
                  {selectedVisit.locationName} - {format(new Date(selectedVisit.visitTimestamp), 'dd MMMM yyyy, hh:mm a')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Contact Person */}
                {selectedVisit.contactPersonName && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{selectedVisit.contactPersonLabel} Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Name:</span> {selectedVisit.contactPersonName}</div>
                      {selectedVisit.contactPersonMobile && (
                        <div><span className="text-gray-500">Mobile:</span> {selectedVisit.contactPersonMobile}</div>
                      )}
                    </div>
                    {selectedVisit.principalRemarks && (
                      <div className="mt-2">
                        <span className="text-gray-500">Remarks:</span>
                        <p className="text-sm mt-1">{selectedVisit.principalRemarks}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Teacher Interactions */}
                {selectedVisit.teacherInteractions.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Teacher Interactions ({selectedVisit.teacherInteractions.length})</h4>
                    <div className="space-y-4">
                      {selectedVisit.teacherInteractions.map((teacher, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{teacher.teacherName}</p>
                              {teacher.primarySubject && (
                                <p className="text-sm text-gray-500">{teacher.primarySubject}</p>
                              )}
                            </div>
                            {teacher.whatsAppNumber && (
                              <span className="text-sm text-gray-500">{teacher.whatsAppNumber}</span>
                            )}
                          </div>

                          {teacher.distributedBooks.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Books Distributed:</p>
                              <ul className="list-disc list-inside text-sm mt-1">
                                {teacher.distributedBooks.map((book, bookIdx) => (
                                  <li key={bookIdx}>
                                    {book.bookTitle} - {book.quantity} {book.quantity > 1 ? 'copies' : 'copy'}
                                    {book.wasRecommended && <span className="text-green-600 ml-2">(Recommended)</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {teacher.placedOrders.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Orders Placed:</p>
                              <ul className="list-disc list-inside text-sm mt-1">
                                {teacher.placedOrders.map((order, orderIdx) => (
                                  <li key={orderIdx} className="text-blue-600">
                                    {order.bookTitle} - {order.quantity} {order.quantity > 1 ? 'copies' : 'copy'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
