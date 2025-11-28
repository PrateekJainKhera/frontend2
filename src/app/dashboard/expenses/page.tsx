'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlusCircle, Check, X, Clock, FilterX, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AddExpenseModal } from './AddExpenseModal';
import { Label } from 'recharts';
interface Expense {
  id: number;
  expenseDate: string;
  type: number;
  amount: number;
  status: number; // 0=Pending, 1=Approved, 2=Rejected
  description: string | null;
}
export default function MyExpensesPage() {
  const { user } = useAuthContext();
  const { t } = useLanguage();
  
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Filters aur Search ke liye states
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const fetchExpenseData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const response = await api.get(`/executives/${user.id}/expenses`);
      setAllExpenses(response.data);
    } catch (error) {
      console.error("Failed to fetch expense data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      fetchExpenseData();
    }
  }, [user]);
  const getExpenseTypeText = (type: number) => {
    if (type === 1) return t('expensePage.dailyAllowance');
    if (type === 0) return t('expensePage.travelAllowance');
    return t('expensePage.otherExpense');
  };
  // Client-side filtering ka poora logic
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(exp => {
      const expenseDate = new Date(exp.expenseDate);
      const statusMatch = filters.status === 'all' 
        ? true 
        : exp.status.toString() === filters.status;
      const dateFromMatch = filters.dateFrom 
        ? expenseDate.setHours(0,0,0,0) >= filters.dateFrom.setHours(0,0,0,0) 
        : true;
      const dateToMatch = filters.dateTo 
        ? expenseDate.setHours(0,0,0,0) <= filters.dateTo.setHours(0,0,0,0) 
        : true;
      
      // Search logic
      const searchMatch = searchQuery.trim() === '' ? true :
        (exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         getExpenseTypeText(exp.type).toLowerCase().includes(searchQuery.toLowerCase()));
      return statusMatch && dateFromMatch && dateToMatch && searchMatch;
    });
  }, [allExpenses, filters, searchQuery]); // searchQuery ko dependency me add karein
  const getStatusBadge = (status: number) => {
    if (status === 1) return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />{t('expensePage.approved')}</Badge>;
    if (status === 2) return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />{t('expensePage.rejected')}</Badge>;
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{t('expensePage.pending')}</Badge>;
  };
  const resetFilters = () => {
    setFilters({
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
    setSearchQuery(''); // Search ko bhi reset karein
  };
  if (isLoading) {
    return <div className="p-4">{t('expensePage.loading')}</div>;
  }
  return (
    <>
      {/* space-y-4 se spacing thodi kam hogi */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t('expensePage.title')}</h2>
          {/* Button ka size chhota karein */}
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('expensePage.addNew')}
          </Button>
        </div>
        {/* --- NAYA COLLAPSIBLE FILTER SECTION --- */}
        <Accordion type="single" collapsible className="w-full bg-white rounded-lg shadow-sm">
          <AccordionItem value="filters">
            <AccordionTrigger className="px-4">
              <span className="font-semibold">Filters</span>
            </AccordionTrigger>
            <AccordionContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(p => ({ ...p, status: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="0">Pending</SelectItem>
                      <SelectItem value="1">Approved</SelectItem>
                      <SelectItem value="2">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <DatePicker
                    date={filters.dateFrom}
                    onSelect={(date) => setFilters(p => ({ ...p, dateFrom: date }))}
                    placeholder="Start Date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <DatePicker
                    date={filters.dateTo}
                    onSelect={(date) => setFilters(p => ({ ...p, dateTo: date }))}
                    placeholder="End Date"
                  />
                </div>
                <Button onClick={resetFilters} variant="outline" className="sm:col-span-2">
                  <FilterX className="h-4 w-4 mr-2" />
                  Reset Filters
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense History ({filteredExpenses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* --- NAYA SEARCH BAR --- */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by type or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(expense => (
                  // --- NAYA COMPACT CARD DESIGN ---
                  <div key={expense.id} className="flex items-start justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1 pr-4">
                      <p className="font-semibold text-base">{getExpenseTypeText(expense.type)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(expense.expenseDate).toLocaleDateString('en-IN')}
                      </p>
                      {expense.description && <p className="text-xs text-gray-400 mt-1 break-words">{expense.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold">₹{expense.amount.toFixed(2)}</p>
                      <div className="mt-1">{getStatusBadge(expense.status)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8 text-base">
                  {allExpenses.length > 0 ? 'No expenses match filters.' : t('expensePage.noExpenses')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenseData}
      />
    </>
  );
}
