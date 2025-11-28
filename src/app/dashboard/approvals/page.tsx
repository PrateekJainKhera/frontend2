'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Check, X, User, IndianRupee, Calendar, FileImage, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';
// --- Types and Enums ---
enum ApprovalStatus { Pending, Approved, Rejected }
enum ExpenseType { TravelAllowance, DailyAllowance, Other }
interface Expense {
  id: number;
  salesExecutiveId: number;
  salesExecutiveName: string;
  type: ExpenseType;
  amount: number;
  expenseDate: string;
  description: string | null;
  status: ApprovalStatus;
  billUrl: string | null;
}
interface Filters {
  executiveName: string;
  expenseType: string; 
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}
// बदला गया: प्रति पेज आइटम की संख्या 5 से बढ़ाकर 10 की गई
const ITEMS_PER_PAGE = 10; 
export default function ApprovalsPage() {
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filters, setFilters] = useState<Filters>({
    executiveName: '',
    expenseType: 'all',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const fetchPendingExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/expenses/pending');
      setPendingExpenses(response.data);
    } catch (error) {
      console.error("Failed to fetch pending expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchPendingExpenses();
  }, []);
  const filteredExpenses = useMemo(() => {
    return pendingExpenses.filter(exp => {
      const expenseDate = new Date(exp.expenseDate);
      const nameMatch = filters.executiveName
        ? exp.salesExecutiveName.toLowerCase().includes(filters.executiveName.toLowerCase())
        : true;

      const typeMatch = filters.expenseType !== 'all'
        ? exp.type.toString() === filters.expenseType
        : true;
      const dateFromMatch = filters.dateFrom ? expenseDate >= filters.dateFrom : true;
      const dateToMatch = filters.dateTo ? expenseDate <= filters.dateTo : true;
      return nameMatch && typeMatch && dateFromMatch && dateToMatch;
    }).sort((a, b) => {
      // Sort by expense date descending (newest first)
      return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
    });
  }, [pendingExpenses, filters]);
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);
  useEffect(() => {
      setCurrentPage(1);
  }, [filters]);
  const handleApproval = async (expenseId: number, newStatus: ApprovalStatus) => {
    try {
      setPendingExpenses(prev => prev.filter(exp => exp.id !== expenseId));
     // await api.put(`/expenses/${expenseId}/approval`, newStatus, {
         await api.post(`/expenses/${expenseId}/approval`, newStatus, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error(`Failed to update expense ${expenseId} status:`, error);
      fetchPendingExpenses(); 
    }
  };
  const getExpenseTypeText = (type: ExpenseType) => {
    return ExpenseType[type].replace(/([A-Z])/g, ' $1').trim();
  };
  const resetFilters = () => {
    setFilters({
      executiveName: '',
      expenseType: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };
  if (isLoading) return <div>Loading pending approvals...</div>;
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Approvals Management</h2>
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 items-end">
          <Input
            placeholder="Search by Executive Name..."
            value={filters.executiveName}
            onChange={(e) => setFilters(p => ({ ...p, executiveName: e.target.value }))}
          />
          <Select
            value={filters.expenseType}
            onValueChange={(value) => setFilters(p => ({ ...p, expenseType: value }))}
          >
            <SelectTrigger><SelectValue placeholder="Select Expense Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.keys(ExpenseType).filter(key => isNaN(Number(key))).map((type, index) => (
                <SelectItem key={type} value={index.toString()}>{getExpenseTypeText(index)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DatePicker
            date={filters.dateFrom}
            onSelect={(date) => setFilters(p => ({ ...p, dateFrom: date }))}
            placeholder="Start Date"
          />
          <DatePicker
            date={filters.dateTo}
            onSelect={(date) => setFilters(p => ({ ...p, dateTo: date }))}
            placeholder="End Date"
          />
          <Button onClick={resetFilters} variant="outline">
            <FilterX className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Expense Claims</span>
            <Badge>{filteredExpenses.length} Pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Check className="h-12 w-12 mx-auto mb-2" />
              <p>{pendingExpenses.length > 0 ? 'No expenses match the current filters.' : 'No pending approvals. Great job!'}</p>
            </div>
          ) : (
            <div className="space-y-3"> 
              {paginatedExpenses.map(exp => (
                // बदला गया: p-4 को p-3 किया गया ताकि कार्ड थोड़ा छोटा हो
                <div key={exp.id} className="p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* बदला गया: space-y-2 को space-y-1 किया गया ताकि लाइनें करीब आएं */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" /><span className="font-semibold">{exp.salesExecutiveName}</span></div>
                    <div className="flex items-center gap-2 text-sm"><IndianRupee className="h-4 w-4 text-gray-500" /><span>{getExpenseTypeText(exp.type)} - <span className="font-bold">₹{exp.amount.toFixed(2)}</span></span></div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="h-4 w-4" /><span>{new Date(exp.expenseDate).toLocaleDateString('en-IN')}</span></div>
                    {exp.description && <p className="text-sm text-gray-500 pl-6">{exp.description}</p>}
                  </div>
                  <div className="flex gap-2 self-end sm:self-center flex-wrap">
                     {exp.billUrl && (
                        <a href={exp.billUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto"><FileImage className="h-4 w-4 mr-2" />View Bill</Button>
                        </a>
                      )}
                    <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleApproval(exp.id, ApprovalStatus.Rejected)}><X className="h-4 w-4 mr-2" />Reject</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproval(exp.id, ApprovalStatus.Approved)}><Check className="h-4 w-4 mr-2" />Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-4 pt-4 mt-4 border-t">
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