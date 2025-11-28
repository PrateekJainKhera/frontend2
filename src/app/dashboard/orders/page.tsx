'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, User, Hash, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { DatePicker } from '@/components/ui/date-picker'; 
// --- Interfaces ---
interface Order {
  id: number;
  orderDate: string;
  bookTitle: string;
  bookSubject: string;
  bookClassLevel: string;
  quantity: number;
   placedByName: string;    // <-- FIX #1
  locationName: string;    // <-- FIX #2
  locationArea: string;    // <-- FIX #3
  executiveName: string;
}
interface TopFilters {
  executive: string;
  location: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}
interface ColumnFilters {
    executive: string;
    location: string;
    teacher: string;
    book: string;
}
// --- Constants ---
const ITEMS_PER_PAGE = 10; // एक पेज पर कितने आइटम दिखाने हैं
export default function OrdersPage() {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [topFilters, setTopFilters] = useState<TopFilters>({
    executive: '',
    location: '',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    executive: '',
    location: '',
    teacher: '',
    book: '',
  });
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    if (user?.roleName === 'Admin') {
      const fetchOrders = async () => {
        try {
          setIsLoading(true);
          const response = await api.get('/orders');
          setOrders(response.data);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrders();
    } else {
        setIsLoading(false);
    }
  }, [user]);
 // NEW, CORRECT FILTER LOGIC
const filteredOrders = useMemo(() => {
  return orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    
    const isAfterFrom = topFilters.dateFrom ? orderDate >= topFilters.dateFrom : true;
    const isBeforeTo = topFilters.dateTo ? orderDate <= topFilters.dateTo : true;
    
    // Top Filters
    const executiveMatch = topFilters.executive ? order.executiveName.toLowerCase().includes(topFilters.executive.toLowerCase()) : true;
    const locationMatch = topFilters.location ? order.locationName.toLowerCase().includes(topFilters.location.toLowerCase()) : true; // <-- FIX
    
    // Column Filters
    const executiveColMatch = columnFilters.executive ? order.executiveName.toLowerCase().includes(columnFilters.executive.toLowerCase()) : true;
    const locationColMatch = columnFilters.location ? order.locationName.toLowerCase().includes(columnFilters.location.toLowerCase()) : true; // <-- FIX
    const teacherColMatch = columnFilters.teacher ? order.placedByName.toLowerCase().includes(columnFilters.teacher.toLowerCase()) : true; // <-- FIX
    const bookColMatch = columnFilters.book ? order.bookTitle.toLowerCase().includes(columnFilters.book.toLowerCase()) : true;
    return isAfterFrom && isBeforeTo && executiveMatch && locationMatch && executiveColMatch && locationColMatch && teacherColMatch && bookColMatch;
  });
}, [orders, topFilters, columnFilters]);
  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);
  // जब भी फ़िल्टर बदलें, पहले पेज पर वापस जाएँ
  useEffect(() => {
      setCurrentPage(1);
  }, [topFilters, columnFilters]);
  const resetFilters = () => {
    setTopFilters({ executive: '', location: '', dateFrom: undefined, dateTo: undefined });
    setColumnFilters({ executive: '', location: '', teacher: '', book: '' });
  };
  const executiveOptions = useMemo(() => [...new Set(orders.map(o => o.executiveName))], [orders]);
  if (isLoading) return <div>Loading all orders...</div>;
  if (user?.roleName !== 'Admin') return <div className="text-red-500 font-semibold">You do not have permission to view this page.</div>;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Order Management</h2>
      
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 items-end">
          <Select value={topFilters.executive} onValueChange={(value) => setTopFilters(p => ({ ...p, executive: value === 'all' ? '' : value }))}>
            <SelectTrigger><SelectValue placeholder="Select Executive" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Executives</SelectItem>
              {executiveOptions.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Search by Location (School)..." value={topFilters.location} onChange={(e) => setTopFilters(p => ({ ...p, location: e.target.value }))} />
          <DatePicker date={topFilters.dateFrom} onSelect={(date) => setTopFilters(p => ({ ...p, dateFrom: date }))} placeholder="Start Date" />
          <DatePicker date={topFilters.dateTo} onSelect={(date) => setTopFilters(p => ({ ...p, dateTo: date }))} placeholder="End Date" />
          <Button onClick={resetFilters} variant="outline"><FilterX className="h-4 w-4 mr-2" />Reset Filters</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Placed Orders</span>
            <Badge>{filteredOrders.length} Total Orders</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left font-semibold">Order Date</th>
                  <th className="p-3 text-left font-semibold">Executive</th>
                  <th className="p-3 text-left font-semibold">Location</th>
                  <th className="p-3 text-left font-semibold">Teacher</th>
                  <th className="p-3 text-left font-semibold">Book Details</th>
                  <th className="p-3 text-left font-semibold">Quantity</th>
                </tr>
                <tr className="border-b">
                  <th className="p-1"></th>
                  <th className="p-1 font-normal"><Input placeholder="Search..." value={columnFilters.executive} onChange={e => setColumnFilters(p => ({...p, executive: e.target.value}))} className="h-8" /></th>
                  <th className="p-1 font-normal"><Input placeholder="Search..." value={columnFilters.location} onChange={e => setColumnFilters(p => ({...p, location: e.target.value}))} className="h-8" /></th>
                  <th className="p-1 font-normal"><Input placeholder="Search..." value={columnFilters.teacher} onChange={e => setColumnFilters(p => ({...p, teacher: e.target.value}))} className="h-8" /></th>
                  <th className="p-1 font-normal"><Input placeholder="Search..." value={columnFilters.book} onChange={e => setColumnFilters(p => ({...p, book: e.target.value}))} className="h-8" /></th>
                  <th className="p-1"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map(o => (
                    <tr key={o.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{new Date(o.orderDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-3"><div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /><span>{o.executiveName}</span></div></td>
                      <td className="p-3"><p className="font-medium">{o.locationName}</p><p className="text-xs text-gray-500">{o.locationArea}</p></td>
                      <td className="p-3">{o.placedByName}</td>
                      <td className="p-3"><p className="font-medium">{o.bookTitle}</p><p className="text-xs text-gray-500">Class: {o.bookClassLevel} | Subject: {o.bookSubject}</p></td>
                      <td className="p-3"><div className="flex items-center gap-2"><Hash className="h-4 w-4 text-gray-400" /><span className="font-bold">{o.quantity}</span></div></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                      <p>No orders match the current filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* --- Pagination Controls UI --- */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-4 pt-4">
                <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  }