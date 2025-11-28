'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookCopy, Package, TrendingUp, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
interface StockItem {
  bookId: number;
  bookTitle: string;
  totalAssigned: number;
  totalDistributed: number;
  remainingStock: number;
}
// Ek page par kitne items dikhane hain
const ITEMS_PER_PAGE = 15;
export default function MyStockPage() {
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // --- NAYE STATES: Sorting aur Pagination ke liye ---
  const [sortConfig, setSortConfig] = useState<{ key: keyof StockItem; direction: 'ascending' | 'descending' } | null>({
    key: 'remainingStock',
    direction: 'descending',
  });
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    if (!user) return;
    const fetchStock = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/executives/${user.id}/stock`);
        setStock(response.data);
      } catch (error) {
        console.error("Failed to fetch stock:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStock();
  }, [user]);
  // --- DATA PROCESSING LOGIC: Filter -> Sort -> Paginate ---
  const filteredAndSortedStock = useMemo(() => {
    let sortableItems = [...stock];
    // 1. Pehle Search Query se filter karein
    if (searchQuery) {
      sortableItems = sortableItems.filter(item =>
        item.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // 2. Fir data ko sort karein
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [stock, searchQuery, sortConfig]);
  // 3. Aakhir me, pagination ke liye data ko slice karein
  const paginatedStock = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedStock.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedStock, currentPage]);
  const totalPages = Math.ceil(filteredAndSortedStock.length / ITEMS_PER_PAGE);
  // Jab bhi search ya sort badle, pehle page par aa jayein
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig]);
  // Sorting ke liye helper function
  const requestSort = (key: keyof StockItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  if (isLoading) {
    return <div>Loading your stock...</div>;
  }
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('stockPage.title')}</h2>
      {/* Quick Summary Cards (ye waise hi rahenge) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
  <Card className="p-2 sm:p-4">
    <CardContent className="p-2 sm:p-4 flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm text-gray-500">{t('stockPage.stock')}</p>
        <p className="text-xl sm:text-3xl font-bold">
          {stock.reduce((sum, item) => sum + item.remainingStock, 0)}
        </p>
      </div>
      <BookCopy className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
    </CardContent>
  </Card>
  <Card className="p-2 sm:p-4">
    <CardContent className="p-2 sm:p-4 flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm text-gray-500">{t('stockPage.assigned')}</p>
        <p className="text-xl sm:text-3xl font-bold">
          {stock.reduce((sum, item) => sum + item.totalAssigned, 0)}
        </p>
      </div>
      <Package className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
    </CardContent>
  </Card>
  <Card className="p-2 sm:p-4">
    <CardContent className="p-2 sm:p-4 flex items-center justify-between">
      <div>
        <p className="text-xs sm:text-sm text-gray-500">{t('stockPage.distributed')}</p>
        <p className="text-xl sm:text-3xl font-bold">
          {stock.reduce((sum, item) => sum + item.totalDistributed, 0)}
        </p>
      </div>
      <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
    </CardContent>
  </Card>
</div>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={t('stockPage.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      {/* NAYA TABLE VIEW */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">
                    <Button variant="ghost" onClick={() => requestSort('bookTitle')} className="px-2">
                      Book Title
                      {sortConfig?.key === 'bookTitle' && (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                    </Button>
                  </th>
                  <th className="p-3 text-center">Assigned</th>
                  <th className="p-3 text-center">Distributed</th>
                  <th className="p-3 text-center">
                    <Button variant="ghost" onClick={() => requestSort('remainingStock')} className="px-2">
                      Remaining Stock
                      {sortConfig?.key === 'remainingStock' && (sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />)}
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedStock.length > 0 ? (
                  paginatedStock.map(item => (
                    <tr key={item.bookId} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.bookTitle}</td>
                      <td className="p-3 text-center">{item.totalAssigned}</td>
                      <td className="p-3 text-center text-green-600">{item.totalDistributed}</td>
                      <td className="p-3 text-center font-bold text-lg text-blue-600">{item.remainingStock}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2" />
                      <p>{stock.length > 0 ? t('stockPage.noBooksFound') : t('stockPage.noInventory')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* PAGINATION CONTROLS */}
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