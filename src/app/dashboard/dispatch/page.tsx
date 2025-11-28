'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Send, FilterX, ChevronLeft, ChevronRight, Truck, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import api from '@/services/api';
import { SendNewConsignmentModal } from './SendNewConsignmentModal';
import { Upload } from 'lucide-react'; // Import the Upload icon
import { BulkUploadModal } from './BulkUploadModal'; // Import the new modal
import { Consignment, ConsignmentItem } from '@/types';
// --- Interfaces and Types ---
interface TopFilters {
  assignedTo: string;
  status: string; // 'all', '0', '1'
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}
interface ColumnFilters {
  transportName: string;
  biltyNo: string;
  assignedTo: string; // Added for column search
}
const ITEMS_PER_PAGE = 10;
export default function DispatchManagementPage() {
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --- Filter & Pagination States ---
  const [topFilters, setTopFilters] = useState<TopFilters>({ assignedTo: 'all', status: 'all', dateFrom: undefined, dateTo: undefined });
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({ transportName: '', biltyNo: '', assignedTo: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  // --- Expandable Row State ---
  const [expandedConsignmentIds, setExpandedConsignmentIds] = useState<number[]>([]);

  const fetchConsignments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/consignments');
      setConsignments(response.data);
    } catch (error) {
      console.error("Failed to fetch consignments:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchConsignments();
  }, []);
  // --- Filtering Logic ---
  const filteredConsignments = useMemo(() => {
    return consignments.filter(c => {
      const dispatchDate = new Date(c.dispatchDate);
      // Top Filters
      const assignedToMatch = topFilters.assignedTo === 'all' || c.assignedTo === topFilters.assignedTo;
      const statusMatch = topFilters.status === 'all' || c.status.toString() === topFilters.status;
      const dateFromMatch = !topFilters.dateFrom || dispatchDate >= topFilters.dateFrom;
      const dateToMatch = !topFilters.dateTo || dispatchDate <= topFilters.dateTo;
      // Column Filters
      const transportNameMatch = c.transportCompanyName.toLowerCase().includes(columnFilters.transportName.toLowerCase());
      const biltyNoMatch = c.biltyNumber.toLowerCase().includes(columnFilters.biltyNo.toLowerCase());
      const assignedToColMatch = (c.assignedTo || '').toLowerCase().includes(columnFilters.assignedTo.toLowerCase()); // Added null safety
      return assignedToMatch && statusMatch && dateFromMatch && dateToMatch && transportNameMatch && biltyNoMatch && assignedToColMatch;
    });
  }, [consignments, topFilters, columnFilters]);
  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredConsignments.length / ITEMS_PER_PAGE);
  const paginatedConsignments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredConsignments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredConsignments, currentPage]);
  useEffect(() => {
    setCurrentPage(1);
  }, [topFilters, columnFilters]);
  const resetFilters = () => {
    setTopFilters({ assignedTo: 'all', status: 'all', dateFrom: undefined, dateTo: undefined });
    setColumnFilters({ transportName: '', biltyNo: '', assignedTo: '' });
  };

  // --- Toggle Expand Function ---
  const toggleExpand = (consignmentId: number) => {
    if (expandedConsignmentIds.includes(consignmentId)) {
      setExpandedConsignmentIds(prev => prev.filter(id => id !== consignmentId));
    } else {
      setExpandedConsignmentIds(prev => [...prev, consignmentId]);
    }
  };

  const assignedToOptions = useMemo(() => [...new Set(consignments.map(c => c.assignedTo))], [consignments]);
  const getStatusText = (status: number) => status === 1 ? 'Delivered' : 'In Transit';
  const getStatusColor = (status: number) => status === 1 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  if (isLoading) return <div>Loading consignments...</div>;
  return (
    <div className="space-y-6">
<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Dispatch & Transport Management</h2>
  
  {/* Buttons Container: Full width on mobile, auto on desktop */}
  <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
    <Button onClick={() => setIsBulkModalOpen(true)} variant="outline" className="w-full sm:w-auto justify-center">
      <Upload className="h-4 w-4 mr-2" />
      Bulk Upload
    </Button>
    <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center">
      <Send className="h-4 w-4 mr-2" />
      Send Consignment
    </Button>
  </div>
</div>

      {/* --- Filters Card --- */}
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 items-end">
          <Select value={topFilters.assignedTo} onValueChange={v => setTopFilters(p => ({...p, assignedTo: v}))}>
            <SelectTrigger><SelectValue placeholder="Assigned To" /></SelectTrigger>
            {/* Added className for scrolling */}
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Users</SelectItem>
              {assignedToOptions.map(name => <SelectItem key={name} value={name || 'Unknown'}>{name || 'Unknown'}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={topFilters.status} onValueChange={v => setTopFilters(p => ({...p, status: v}))}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="0">In Transit</SelectItem><SelectItem value="1">Delivered</SelectItem></SelectContent></Select>
          <DatePicker date={topFilters.dateFrom} onSelect={d => setTopFilters(p => ({...p, dateFrom: d}))} placeholder="Sent From" />
          <DatePicker date={topFilters.dateTo} onSelect={d => setTopFilters(p => ({...p, dateTo: d}))} placeholder="Sent To" />
          <Button onClick={resetFilters} variant="outline"><FilterX className="h-4 w-4 mr-2" />Reset Filters</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Consignment Tracking</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 w-12"></th>
                  <th className="text-left p-3">Transport Name</th>
                  <th className="text-left p-3">Bilty No.</th>
                  <th className="text-left p-3">Bilty Bill</th>
                  <th className="text-left p-3">Assigned To</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Sent Date</th>
                  <th className="text-left p-3">Received Date</th>
                  <th className="text-left p-3">Freight Cost</th>
                </tr>
                {/* Updated column filter row */}
                <tr className="border-b">
                  <th className="p-1"></th>
                  <th className="p-1 font-normal"><Input placeholder="Search..." value={columnFilters.transportName} onChange={e => setColumnFilters(p => ({...p, transportName: e.target.value}))} className="h-8" /></th>
                  <th className="p-1 font-normal"><Input placeholder="Search..." value={columnFilters.biltyNo} onChange={e => setColumnFilters(p => ({...p, biltyNo: e.target.value}))} className="h-8" /></th>
                  <th className="p-1"></th>
                  <th className="p-1 font-normal"><Input placeholder="Search..." value={columnFilters.assignedTo} onChange={e => setColumnFilters(p => ({...p, assignedTo: e.target.value}))} className="h-8" /></th>
                  <th className="p-1"></th><th className="p-1"></th><th className="p-1"></th><th className="p-1"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedConsignments.length > 0 ? (
                  paginatedConsignments.map((c) => {
                    const isExpanded = expandedConsignmentIds.includes(c.id);
                    return (
                      <React.Fragment key={c.id}>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <button
                              onClick={() => toggleExpand(c.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title={isExpanded ? "Hide books" : "Show books"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronUp className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 font-medium">{c.transportCompanyName}</td>
                          <td className="p-3">{c.biltyNumber}</td>
                          <td className="p-3">
                            {c.biltyBillUrl ? (
                              <a
                                href={c.biltyBillUrl.startsWith('http')
                                  ? c.biltyBillUrl
                                  : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${c.biltyBillUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">View</span>
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="p-3">{c.assignedTo}</td>
                          <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>{getStatusText(c.status)}</span></td>
                          <td className="p-3 text-sm">{new Date(c.dispatchDate).toLocaleDateString('en-IN')}</td>
                          <td className="p-3 text-sm">{c.receivedDate ? new Date(c.receivedDate).toLocaleDateString('en-IN') : 'Pending'}</td>
                          <td className="p-3 font-semibold">{c.freightCost ? `₹${c.freightCost}` : '-'}</td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-blue-50">
                            <td colSpan={9} className="p-0">
                              <div className="p-4 ml-8">
                                <h4 className="font-semibold mb-3 text-blue-900">Books in this Consignment:</h4>
                                {c.items && c.items.length > 0 ? (
                                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="bg-gray-100 border-b">
                                          <th className="text-left p-3 font-semibold">Book Title</th>
                                          <th className="text-left p-3 font-semibold">Class</th>
                                          <th className="text-left p-3 font-semibold">Subject</th>
                                          <th className="text-right p-3 font-semibold">Quantity</th>
                                          <th className="text-right p-3 font-semibold">Unit Price</th>
                                          <th className="text-right p-3 font-semibold">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {c.items.map((item, idx) => (
                                          <tr key={item.id || idx} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-medium">{item.bookTitle}</td>
                                            <td className="p-3">{item.bookClassLevel}</td>
                                            <td className="p-3">{item.bookSubject}</td>
                                            <td className="text-right p-3">{item.quantity}</td>
                                            <td className="text-right p-3">₹{(item.unitPrice || 0).toFixed(2)}</td>
                                            <td className="text-right p-3 font-semibold">₹{(item.quantity * (item.unitPrice || 0)).toFixed(2)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot>
                                        <tr className="bg-gray-100 font-bold">
                                          <td colSpan={5} className="text-right p-3 text-gray-700">Total Consignment Value:</td>
                                          <td className="text-right p-3 text-blue-900">
                                            ₹{(c.items || []).reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0).toFixed(2)}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-gray-500 italic">No books found in this consignment.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-500">
                      <Truck className="h-12 w-12 mx-auto mb-2" />
                      <p>{consignments.length > 0 ? 'No consignments match the current filters.' : 'No consignments found.'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
    {totalPages > 1 && (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
    <span className="text-sm text-gray-600 order-1 sm:order-1">
      Page {currentPage} of {totalPages}
    </span>
    
    <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
        disabled={currentPage === 1}
        className="flex-1 sm:flex-none justify-center"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />Previous
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
        disabled={currentPage === totalPages}
        className="flex-1 sm:flex-none justify-center"
      >
        Next<ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  </div>
)}
        </CardContent>
      </Card>
      <SendNewConsignmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchConsignments} />
        <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={fetchConsignments}
      />
    </div>
  );
}