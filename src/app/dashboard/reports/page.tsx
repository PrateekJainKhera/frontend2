'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import  { Download, Search, Eye, BarChart2, Users, IndianRupee, Route } from 'lucide-react'; // Icons update karein
import api from '@/services/api';
import { DateRange } from 'react-day-picker';
import { useAuthContext } from '@/context/AuthContext';
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // <-- YEH IMPORT ADD KAREIN
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Naye icons import karein
import { VisitDetailModal } from './VisitDetailModal';
import { LocationVisitHistoryModal } from './LocationVisitHistoryModal';
import { ToggleLeft, ToggleRight } from 'lucide-react';

// Interfaces 
interface PerformanceSummary { executiveId: number; executiveName: string; roleName: string; totalVisits: number; plannedVisits: number; totalDistanceKm: number; totalExpenses: number; booksDistributed: number;  totalTA: number;
  totalDA: number;
  otherExpenses: number; }

interface DetailedVisit { id: number; visitDate: string; executiveName: string; locationName: string; locationType: string; area: string; principalRemarks: string | null; locationVisitCount: number; }

interface LocationSummary { locationId: number; locationName: string; locationType: string; area: string; totalVisits: number; lastVisitDate: string; lastVisitExecutive: string; lastVisitId: number; }

interface VisitHistoryItem { visitId: number; visitDate: string; executiveName: string; teachersInteracted: number; booksDistributed: number; ordersPlaced: number; principalRemarks: string | null; }


interface ExpenseReport { expenseDate: string; executiveName: string; type: number; amount: number; status: number; description: string | null; }
interface InventoryLog { date: string; executiveName: string; bookTitle: string; teacherName: string; quantity: number; type: 'Distributed' | 'Ordered'; }
interface WorkdaySummary {
  date: string;
  executiveName: string;
  startTime: string;
  endTime: string;
  duration: string | null;
  totalDistanceKm: number;
}

interface PaginatedData<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}
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
type ReportTab = 'performance' | 'visits' | 'expenses' | 'inventory'| 'workday'; 

// Ye function date ko UTC me convert kiye bina, usko 'YYYY-MM-DD' format me badalta hai
const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};


export default function ReportsPage() {
  const { user: currentUser } = useAuthContext();
  const [activeTab, setActiveTab] = useState<ReportTab>('performance');
  
  const [executives, setExecutives] = useState<{ id: number; name: string }[]>([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<string>('all');
  const getDateMinusDays = (days: number) => { const date = new Date(); date.setDate(date.getDate() - days); return date; };
 const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: getDateMinusDays(6), to: new Date() }); 
  const [performanceData, setPerformanceData] = useState<PerformanceSummary[]>([]);
  const [visitData, setVisitData] = useState<DetailedVisit[]>([]);
  const [locationSummaryData, setLocationSummaryData] = useState<LocationSummary[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseReport[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryLog[]>([]);
  const [workdayData, setWorkdayData] = useState<PaginatedData<WorkdaySummary> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visitViewMode, setVisitViewMode] = useState<'grouped' | 'detailed'>('grouped');

  // Client-side pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
   const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedVisitDetails, setSelectedVisitDetails] = useState<VisitDetailReport | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedLocationHistory, setSelectedLocationHistory] = useState<VisitHistoryItem[]>([]);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.roleName === 'Admin') {
      api.get('/executives').then(res => setExecutives(res.data));
    }
  }, [currentUser]);
  const fetchReports = useCallback(async (page = 1) => {     
    if (!dateRange?.from || !dateRange?.to) { alert("Please select a valid date range."); return; }
    setIsLoading(true);
    try {
       // --- YEH HAI FIX: toISOString() ki jagah naya function use karein ---
      const params = {
        startDate: formatDateForApi(dateRange.from),
        endDate: formatDateForApi(dateRange.to),
        executiveId: selectedExecutiveId === 'all' ? undefined : parseInt(selectedExecutiveId),
       pageNumber: page, // <-- Page number bhejein
        pageSize: 15    // <-- Page size bhejein
     
      };
      const [perfRes, visitRes, locationSummaryRes, expenseRes, inventoryRes, workdayRes] = await Promise.all([
        api.get('/reports/performance-summary', { params }),
        api.get('/reports/detailed-visits', { params }),
        api.get('/reports/locations-summary', { params }),
        api.get('/reports/expenses', { params }),
        api.get('/reports/inventory-log', { params }),
        api.get('/reports/workday-summary', { params }) 
      ]);
      setPerformanceData(perfRes.data);
      setVisitData(visitRes.data);
      setLocationSummaryData(locationSummaryRes.data);
      setExpenseData(expenseRes.data);
      setInventoryData(inventoryRes.data);
      setWorkdayData(workdayRes.data);
      setCurrentPage(1); // Reset to first page when new data is fetched

    } catch (error) { console.error("Failed to generate reports:", error); alert("Failed to generate reports."); }
    finally { setIsLoading(false); }
  }, [dateRange, selectedExecutiveId]);
  
useEffect(() => {
  // Ye check zaroori hai taaki page load hote hi report generate na ho,
  // sirf "Generate Report" button ya "Eye" icon par click karne par ho.
  // Hum check kar rahe hain ki kya data pehle se loaded hai.
  if (performanceData.length > 0 || visitData.length > 0 || expenseData.length > 0) {
    fetchReports();
  }
}, [selectedExecutiveId, dateRange]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleViewVisitDetails = async (visitId: number) => {
    setIsModalLoading(true);
    setSelectedVisitDetails(null); // Purana data clear karein
    setIsVisitModalOpen(true);
    try {
      // Backend se naye endpoint ko call karein
      const response = await api.get(`/reports/visit-details/${visitId}`);
      setSelectedVisitDetails(response.data);
    } catch (error) {
      console.error("Failed to fetch visit details:", error);
      // Yahan aap toast notification dikha sakte hain
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleViewLocationHistory = async (locationId: number, locationType: string, locationName: string) => {
    setIsHistoryLoading(true);
    setSelectedLocationName(locationName);
    setIsHistoryModalOpen(true);
    try {
      const params: any = {
        locationId,
        locationType: locationType === 'School' ? 0 : locationType === 'CoachingCenter' ? 1 : 2
      };
      if (dateRange?.from && dateRange?.to) {
        params.startDate = formatDateForApi(dateRange.from);
        params.endDate = formatDateForApi(dateRange.to);
      }
      const response = await api.get('/reports/location-visits', { params });
      setSelectedLocationHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch location visit history:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const exportVisitLogWithDetails = async () => {
    if (visitData.length === 0) {
      alert("No visit data to export.");
      return;
    }
    setIsExporting(true);
    try {
      // 1. Sirf filtered visits ki IDs nikalein
      const visitIds = visitData.map(v => v.id);

      // 2. Naye bulk endpoint ko call karein
      const response = await api.post('/reports/bulk-visit-details', visitIds);
      const detailedVisits: VisitDetailReport[] = response.data;

      // 3. Data ko CSV ke liye flat karein
      const flatData: any[] = [];
      detailedVisits.forEach(visit => {
        // Har visit ke liye ek base object banayein
        const baseRow = {
          'Visit ID': visit.visitId,
          'Date': new Date(visit.visitTimestamp).toLocaleString('en-IN'),
          'Executive': visit.executiveName,
          'Location': visit.locationName,
          'Location Type': visit.locationType,
          'Contact Person': visit.contactPersonName,
          'Contact Mobile': visit.contactPersonMobile,
          'Remarks': visit.principalRemarks,
        };

        if (visit.teacherInteractions.length === 0) {
          // Agar koi teacher interaction nahi hai, toh bas base row add karein
          flatData.push({ ...baseRow });
        } else {
          // Har teacher interaction ke liye rows banayein
          visit.teacherInteractions.forEach(interaction => {
            // Har distributed book ke liye ek row
            interaction.distributedBooks.forEach(book => {
              flatData.push({
                ...baseRow,
                'Interaction Type': 'Specimen Given',
                'Teacher Name': interaction.teacherName,
                'Book Title': book.bookTitle,
                'Quantity': book.quantity,
                'Was Recommended': book.wasRecommended ? 'Yes' : 'No',
              });
            });
            // Har order ke liye ek row
            interaction.placedOrders.forEach(order => {
              flatData.push({
                ...baseRow,
                'Interaction Type': 'Order Placed',
                'Teacher Name': interaction.teacherName,
                'Book Title': order.bookTitle,
                'Quantity': order.quantity,
                'Was Recommended': '', // Order ke liye applicable nahi
              });
            });
          });
        }
      });

      // 4. CSV generate karein
      exportToCsv('detailed_visit_report', flatData);

    } catch (error) {
      console.error("Failed to export detailed visit log:", error);
      alert("An error occurred while exporting.");
    } finally {
      setIsExporting(false);
    }
  };


  
// Jab bhi executive ya date range badle, ye chalega
  // --- NAYA FEATURE #1: Executive 360° View ---
  const handleExecutiveFocus = (execId: number) => {
    setSelectedExecutiveId(execId.toString());
    // Automatically generate report for this executive
    // fetchReports();
  };
const handlePresetDateRange = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
    const today = new Date();
    let fromDate: Date;
    let toDate: Date = new Date(); // End date is always today for these presets
    switch (preset) {
      case 'today':
        fromDate = new Date();
        toDate = new Date();
        break;
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        fromDate = yesterday;
        toDate = yesterday;
        break;
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Assuming week starts on Sunday
        fromDate = startOfWeek;
        break;
      case 'month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
    }
    setDateRange({ from: fromDate, to: toDate });
  };
   const exportToCsv = (filename: string, data: any[]) => {
    if (data.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = Object.keys(data[0]);
    // Ye function har value ko CSV ke liye safe banayega
    const formatValue = (value: any): string => {
      if (value === null || value === undefined) {
        return ''; // null ya undefined ko khaali chhod dein
      }
      
      let stringValue = String(value);
      // Agar value me comma, double-quote, ya newline hai, toh usko quotes me daalein
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        // Har double-quote ko do double-quotes se replace karein
        stringValue = stringValue.replace(/"/g, '""');
        return `"${stringValue}"`;
      }
      return stringValue;
    };
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => formatValue(row[header])).join(',')
      ) // Data rows
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  function getExpenseTypeText(type: number) { return type === 1 ? "DA" : type === 0 ? "TA" : "Other"; }
  function getStatusText(status: number) { return status === 1 ? "Approved" : status === 2 ? "Rejected" : "Pending"; }
 const kpiData = useMemo(() => {
    if (performanceData.length === 0) {
      return { totalVisits: 0, totalExpenses: 0, totalDistance: 0, activeExecutives: 0 };
    }

    const totalVisits = performanceData.reduce((sum, item) => sum + item.totalVisits, 0);
    const totalExpenses = performanceData.reduce((sum, item) => sum + item.totalExpenses, 0);
    const totalDistance = performanceData.reduce((sum, item) => sum + item.totalDistanceKm, 0);
    // Active executives ka count unique IDs se nikalenge
    const activeExecutives = new Set(performanceData.map(item => item.executiveId)).size;
    return { totalVisits, totalExpenses, totalDistance, activeExecutives };
  }, [performanceData]);

  // Client-side pagination for each report type
  const paginatedVisitData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: visitData.slice(start, end),
      totalPages: Math.ceil(visitData.length / pageSize),
      totalCount: visitData.length
    };
  }, [visitData, currentPage, pageSize]);

  const paginatedExpenseData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: expenseData.slice(start, end),
      totalPages: Math.ceil(expenseData.length / pageSize),
      totalCount: expenseData.length
    };
  }, [expenseData, currentPage, pageSize]);

  const paginatedInventoryData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: inventoryData.slice(start, end),
      totalPages: Math.ceil(inventoryData.length / pageSize),
      totalCount: inventoryData.length
    };
  }, [inventoryData, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports Dashboard</h1>
      </div>
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="grow min-w-[300px]">
            <label className="text-sm font-medium">Date Range</label>
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Button size="sm" variant="ghost" onClick={() => handlePresetDateRange('today')}>Today</Button>
              <Button size="sm" variant="ghost" onClick={() => handlePresetDateRange('yesterday')}>Yesterday</Button>
              <Button size="sm" variant="ghost" onClick={() => handlePresetDateRange('week')}>This Week</Button>
              <Button size="sm" variant="ghost" onClick={() => setDateRange({ from: getDateMinusDays(6), to: new Date() })}>Last 7 Days</Button>
              <Button size="sm" variant="ghost" onClick={() => handlePresetDateRange('month')}>This Month</Button>
            </div>
          </div>
          {currentUser?.roleName === 'Admin' && (
            <div className="grow min-w-[200px]">
              <label className="text-sm font-medium">Executive</label>
              <Select value={selectedExecutiveId} onValueChange={setSelectedExecutiveId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Executives</SelectItem>
                  {executives.map(exec => (<SelectItem key={exec.id} value={exec.id.toString()}>{exec.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
             <Button 
            onClick={() => fetchReports(1)} // Hamesha pehla page fetch karein
            disabled={isLoading} 
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>
 {performanceData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total Visits" value={kpiData.totalVisits.toLocaleString()} icon={BarChart2} color="text-blue-500" />
          <KpiCard title="Total Expenses" value={`₹${kpiData.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={IndianRupee} color="text-green-500" />
          <KpiCard title="Total Distance" value={`${kpiData.totalDistance.toFixed(2)} km`} icon={Route} color="text-orange-500" />
          <KpiCard title="Active Executives" value={kpiData.activeExecutives.toLocaleString()} icon={Users} color="text-purple-500" />
        </div>
      )}
      <Card>
        <CardHeader className="p-0">
<div className="flex space-x-4 overflow-x-auto whitespace-nowrap px-4 border-b">
            <TabButton name="Performance" tab="performance" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton name="Visit Log" tab="visits" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton name="Expense Log" tab="expenses" activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton name="Inventory Log" tab="inventory" activeTab={activeTab} setActiveTab={setActiveTab} />
             <TabButton name="Workday Summary" tab="workday" activeTab={activeTab} setActiveTab={setActiveTab} />

          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? <div className="text-center py-12">Loading report data...</div> : (
            <>
              {activeTab === 'performance' && <PerformanceTable data={performanceData} onFocus={handleExecutiveFocus} onExport={() => exportToCsv('performance_summary', performanceData)} />}

              {activeTab === 'visits' && (
                <>
                  {/* Toggle between grouped and detailed view */}
                  <div className="flex justify-between items-center mb-4">
                    <Button
                      variant={visitViewMode === 'grouped' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVisitViewMode('grouped')}
                      className="gap-2"
                    >
                      {visitViewMode === 'grouped' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      Grouped by Location
                    </Button>
                    <Button
                      variant={visitViewMode === 'detailed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setVisitViewMode('detailed')}
                      className="gap-2"
                    >
                      {visitViewMode === 'detailed' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      All Visits
                    </Button>
                  </div>

                  {visitViewMode === 'grouped' ? (
                    <LocationSummaryTable
                      data={locationSummaryData}
                      onViewHistory={handleViewLocationHistory}
                      onViewLatestVisit={handleViewVisitDetails}
                      onExport={() => exportToCsv('locations_summary', locationSummaryData)}
                      isExporting={isExporting}
                    />
                  ) : (
                    <>
                      <ReportTable
                        data={paginatedVisitData.items}
                        columns={['id', 'visitDate', 'executiveName', 'locationName', 'locationType', 'area', 'locationVisitCount', 'principalRemarks']}
                        onExport={exportVisitLogWithDetails}
                        isExporting={isExporting}
                        activeTab={activeTab}
                        onViewVisitDetails={handleViewVisitDetails}
                      />
                      {paginatedVisitData.totalPages > 1 && (
                        <PaginationControls
                          currentPage={currentPage}
                          totalPages={paginatedVisitData.totalPages}
                          totalCount={paginatedVisitData.totalCount}
                          onPageChange={setCurrentPage}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === 'expenses' && (
                <>
                  <ReportTable
                    data={paginatedExpenseData.items.map(e => ({...e, type: getExpenseTypeText(e.type), status: getStatusText(e.status)}))}
                    columns={['expenseDate', 'executiveName', 'type', 'status', 'amount']}
                    onExport={() => exportToCsv('expense_log', expenseData)}
                    activeTab={activeTab}
                    onViewVisitDetails={() => {}}
                    isExporting={isExporting}
                  />
                  {paginatedExpenseData.totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={paginatedExpenseData.totalPages}
                      totalCount={paginatedExpenseData.totalCount}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}

              {activeTab === 'inventory' && (
                <>
                  <ReportTable
                    data={paginatedInventoryData.items}
                    columns={['date', 'executiveName', 'bookTitle', 'teacherName', 'quantity']}
                    onExport={() => exportToCsv('inventory_log', inventoryData)}
                    activeTab={activeTab}
                    onViewVisitDetails={() => {}}
                    isExporting={isExporting}
                  />
                  {paginatedInventoryData.totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={paginatedInventoryData.totalPages}
                      totalCount={paginatedInventoryData.totalCount}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}

   {activeTab === 'workday' && workdayData && (
                <>
              <ReportTable 
  data={workdayData.items} 
  columns={['date', 'name', 'startTime', 'endTime', 'totalDistanceKm', 'sessions']} 
  onExport={() => exportToCsv('workday_summary', workdayData.items)} 
  activeTab={activeTab} 
  onViewVisitDetails={() => {}}
  isExporting={isExporting}
/>
                  {/* --- YEH NAYA PAGINATION UI ADD KAREIN --- */}
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={workdayData.totalPages}
                    totalCount={workdayData.totalCount}
                    onPageChange={(page) => fetchReports(page)}
                  />
                </>
              )}
                
            </>
          )}
        </CardContent>
      </Card>
  <VisitDetailModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        visitData={selectedVisitDetails}
        isLoading={isModalLoading}
      />

      <LocationVisitHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        locationName={selectedLocationName}
        visits={selectedLocationHistory}
        isLoading={isHistoryLoading}
        onViewDetails={handleViewVisitDetails}
      />

    </div>
  );
}

// LocationSummaryTable Component
const LocationSummaryTable = ({ data, onViewHistory, onViewLatestVisit, onExport, isExporting }: {
  data: LocationSummary[];
  onViewHistory: (locationId: number, locationType: string, locationName: string) => void;
  onViewLatestVisit: (visitId: number) => void;
  onExport: () => void;
  isExporting: boolean;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Area</TableHead>
              <TableHead className="text-center">Total Visits</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead>Last Executive</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((location) => (
              <TableRow key={`${location.locationId}-${location.locationType}`}>
                <TableCell className="font-medium">{location.locationName}</TableCell>
                <TableCell>{location.locationType}</TableCell>
                <TableCell>{location.area}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">
                    {location.totalVisits}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(location.lastVisitDate).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </TableCell>
                <TableCell>{location.lastVisitExecutive}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewHistory(location.locationId, location.locationType, location.locationName)}
                      title="View all visits"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m7 16 4-4 4 4 6-6"/></svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewLatestVisit(location.lastVisitId)}
                      title="View latest visit details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
function PaginationControls({ currentPage, totalPages, totalCount, onPageChange }: {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t">
      {totalCount !== undefined && (
        <span className="text-sm text-gray-600">
          Total: {totalCount} records
        </span>
      )}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

const KpiCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color: string }) => (
  <Card>
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <Icon className={`h-8 w-8 ${color}`} />
    </CardContent>
  </Card>
);
// --- HELPER COMPONENTS (Inko file ke end me add karein) ---
const TabButton = ({ name, tab, activeTab, setActiveTab }: { name: string, tab: ReportTab, activeTab: ReportTab, setActiveTab: (tab: ReportTab) => void }) => (
  <button onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-medium text-sm transition-colors ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>{name}</button>
);
// Performance Table (Special with Focus button)
const PerformanceTable = ({ data, onFocus, onExport }: { data: PerformanceSummary[], onFocus: (id: number) => void, onExport: () => void }) => (
  <div className="space-y-4">
    <div className="flex justify-end">
      <Button variant="outline" size="sm" onClick={onExport}><Download className="h-4 w-4 mr-2" />Export</Button>
    </div>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Executive</TableHead>
            <TableHead>Role</TableHead>
             <TableHead className="text-right">Planned Visits</TableHead>
            <TableHead className="text-right">Visits</TableHead>
            <TableHead className="text-right">Distance (KM)</TableHead>
            {/* Naye Columns */}
            <TableHead className="text-right">Total TA (₹)</TableHead>
            <TableHead className="text-right">Total DA (₹)</TableHead>
            <TableHead className="text-right">Other Exp (₹)</TableHead>
            <TableHead className="text-right font-bold">Total Exp (₹)</TableHead>
            <TableHead className="text-right">Books Given</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
      <TableBody>
  {data.map(item => {
    const rowContent = (
      <TableRow 
        key={item.executiveId}
        className="cursor-pointer"
        onClick={() => onFocus(item.executiveId)}
      >
        <TableCell className="font-medium">{item.executiveName}</TableCell>
        <TableCell>{item.roleName}</TableCell>
        <TableCell className="text-right">{item.plannedVisits}</TableCell>
        <TableCell className="text-right">{item.totalVisits}</TableCell>
        <TableCell className="text-right">{item.totalDistanceKm.toFixed(2)}</TableCell>
        <TableCell className="text-right">{item.totalTA.toFixed(2)}</TableCell>
        <TableCell className="text-right">{item.totalDA.toFixed(2)}</TableCell>
        <TableCell className="text-right">{item.otherExpenses.toFixed(2)}</TableCell>
        <TableCell className="text-right font-bold">{item.totalExpenses.toFixed(2)}</TableCell>
        <TableCell className="text-right">{item.booksDistributed}</TableCell>
        <TableCell>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { 
              e.stopPropagation();
              onFocus(item.executiveId); 
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
    return rowContent;
  })}
</TableBody>
      </Table>
    </div>
  </div>
);
// Generic Report Table with Search and Export
const ReportTable = ({ data, columns, onExport, activeTab, onViewVisitDetails, isExporting }: { 
  data: any[], 
  columns: string[], 
  onExport: () => void,
  activeTab: ReportTab,
  onViewVisitDetails: (id: number) => void,
  isExporting: boolean // <-- YEH LINE ADD KAREIN
}) => {
    const [filters, setFilters] = useState<Record<string, string>>({});
  
  const filteredData = useMemo(() => {
    return data.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return String(row[key]).toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [data, filters]);
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const headers = columns.map(col => col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
  
   if (columns.includes('totalDistanceKm') && columns.includes('sessions')) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>
        
        {/* Table Headers */}
<div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-sm font-semibold text-black border-b">
          <div className="col-span-2">Date</div>
          <div className="col-span-4">Executive Name</div>
          <div className="col-span-2">First Start</div>
          <div className="col-span-2">Last End</div>
          <div className="col-span-2 text-right">Distance (Km)</div>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {filteredData.map((row, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="border rounded-lg bg-white shadow-sm">
              <AccordionTrigger className="hover:no-underline p-4 text-sm">
                {/* Desktop View */}
                <div className="hidden md:grid grid-cols-12 gap-4 w-full items-center">
                  <div className="col-span-2 font-medium">{row.date}</div>
                  <div className="col-span-4 font-medium">{row.name}</div>
                  <div className="col-span-2">{row.startTime}</div>
                  <div className="col-span-2">{row.endTime}</div>
                  <div className="col-span-2 text-right font-bold text-lg">{row.totalDistanceKm.toFixed(2)}</div>
                </div>
                {/* Mobile View */}
                <div className="grid md:hidden grid-cols-2 gap-x-4 gap-y-2 w-full text-left">
                    <div className="col-span-2">
                        <p className="font-bold text-base">{row.name}</p>
                        <p className="text-xs text-gray-500">{row.date}</p>
                    </div>
                    <div className="col-span-2 border-t pt-2 mt-2">
                        <p className="text-xs text-gray-500">Distance</p>
                        <p className="font-bold text-xl">{row.totalDistanceKm.toFixed(2)} km</p>
                    </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 border-t">
                <h4 className="font-semibold mb-2 text-base">Work Sessions:</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session Start</TableHead>
                      <TableHead>Session End</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {row.sessions?.map((session: any, sIndex: number) => (
                      <TableRow key={sIndex}>
                        <TableCell>{session.sessionStart}</TableCell>
                        <TableCell>{session.sessionEnd}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onExport}><Download className="h-4 w-4 mr-2" />Export</Button>
      </div>
       <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
              {activeTab === 'visits' && <TableHead>Actions</TableHead>}
          </TableRow>
          {/* --- NAYA FEATURE #3: Column-wise Search --- */}
          <TableRow>
            {columns.map(col => (
              <TableHead key={`${col}-filter`} className="p-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    placeholder={`Search ${headers[columns.indexOf(col)]}...`}
                    value={filters[col] || ''}
                    onChange={(e) => handleFilterChange(col, e.target.value)}
                    className="h-8 pl-6"
                  />
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
  {filteredData.map((row, rowIndex) => {
    // --- YEH HAI FINAL FIX ---
    // Hum har row ke liye JSX ko ek variable me store karenge
    // aur fir us variable ko return karenge. Isse whitespace ka chance khatam ho jaata hai.
    const rowContent = (
      <TableRow 
        key={rowIndex}
        className={activeTab === 'visits' ? 'cursor-pointer' : ''}
        onClick={activeTab === 'visits' ? () => onViewVisitDetails(row.id) : undefined}
      >
        {columns.map(col => (
          <TableCell key={col}>
            {col.toLowerCase().includes('date') ? (
              new Date(row[col]).toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })
            ) : col === 'principalRemarks' ? (
              <p title={row[col] || ''} className="max-w-xs truncate">
                {row[col] || 'N/A'}
              </p>
            ) : (
              typeof row[col] === 'number' ? row[col].toFixed(2) : row[col]
            )}
          </TableCell>
        ))}
        {activeTab === 'visits' && (
          <TableCell>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => { 
                e.stopPropagation(); 
                onViewVisitDetails(row.id); 
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TableCell>
        )}
      </TableRow>
    );
    return rowContent;
  })}
</TableBody>
      </Table>
    </div>
</div>
  );
};