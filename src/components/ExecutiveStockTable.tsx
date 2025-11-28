'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { Search, RefreshCw, Package, AlertCircle, TrendingDown, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface StockItem {
  bookId: number;
  bookTitle: string;
  totalAssigned: number;
  totalDistributed: number;
  remainingStock: number;
}

interface ExecutiveStock {
  executiveId: number;
  executiveName: string;
  totalStock: number;
  totalDistributed: number;
  remainingStock: number;
  stockItems: StockItem[];
}

export function ExecutiveStockTable() {
  const [stockData, setStockData] = useState<ExecutiveStock[]>([]);
  const [filteredData, setFilteredData] = useState<ExecutiveStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedExecutive, setExpandedExecutive] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchStockData = async () => {
    try {
      setIsLoading(true);
      
      // Get all active executives
      const executivesResponse = await api.get('/executives');
      const executives = executivesResponse.data;

      // Fetch stock for each executive
      const stockPromises = executives.map(async (exec: any) => {
        try {
          const stockResponse = await api.get(`/executives/${exec.id}/stock`);
          const stockItems: StockItem[] = stockResponse.data;

          return {
            executiveId: exec.id,
            executiveName: exec.name,
            totalStock: stockItems.reduce((sum, item) => sum + item.totalAssigned, 0),
            totalDistributed: stockItems.reduce((sum, item) => sum + item.totalDistributed, 0),
            remainingStock: stockItems.reduce((sum, item) => sum + item.remainingStock, 0),
            stockItems: stockItems
          };
        } catch (error) {
          console.error(`Failed to fetch stock for executive ${exec.id}:`, error);
          return {
            executiveId: exec.id,
            executiveName: exec.name,
            totalStock: 0,
            totalDistributed: 0,
            remainingStock: 0,
            stockItems: []
          };
        }
      });

      const results = await Promise.all(stockPromises);
      setStockData(results);
      setFilteredData(results);
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(stockData);
    } else {
      const filtered = stockData.filter(exec =>
        exec.executiveName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
    // Reset to page 1 when search changes
    setCurrentPage(1);
  }, [searchTerm, stockData]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // Get paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const toggleExpand = (executiveId: number) => {
    setExpandedExecutive(expandedExecutive === executiveId ? null : executiveId);
  };

const getStockStatus = (remaining: number, total: number) => {
    if (total === 0) return { label: 'No Stock', color: 'text-gray-600', bg: 'bg-gray-100' };
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return { label: 'Good', color: 'text-green-700', bg: 'bg-green-100' };
    if (percentage > 20) return { label: 'Medium', color: 'text-yellow-700', bg: 'bg-yellow-100' };
    if (percentage > 0) return { label: 'Low', color: 'text-red-700', bg: 'bg-red-100' };
    return { label: 'Empty', color: 'text-red-800', bg: 'bg-red-100' };
  };

  const totalStats = {
    totalExecutives: stockData.length,
    totalStockAssigned: stockData.reduce((sum, exec) => sum + exec.totalStock, 0),
    totalDistributed: stockData.reduce((sum, exec) => sum + exec.totalDistributed, 0),
    totalRemaining: stockData.reduce((sum, exec) => sum + exec.remainingStock, 0),
  };
const kpiCards = [
    { label: 'Total Executives', value: totalStats.totalExecutives, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Assigned', value: totalStats.totalStockAssigned, icon: Package, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Distributed', value: totalStats.totalDistributed, icon: TrendingDown, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Remaining', value: totalStats.totalRemaining, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="shadow-sm border-none ring-1 ring-gray-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xl md:text-2xl font-bold mt-1 text-gray-900">{kpi.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 md:h-5 md:w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stock Table */}
      <Card>
<CardHeader className="border-b p-4">
          {/* Mobile: Stacked Vertical | Desktop: Row Horizontal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">Executive Stock Details</CardTitle>
            
            {/* Search Container */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {/* FIX: w-full on mobile, w-64 on desktop */}
                <Input
                  placeholder="Search executive..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64" 
                />
              </div>
              {/* Refresh Button */}
              <Button onClick={fetchStockData} variant="outline" size="icon" disabled={isLoading} className="shrink-0">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading stock data...</p>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No executives found</p>
            </div>
          ) : (
            <div className="divide-y">
              {paginatedData.map((exec) => {
                const status = getStockStatus(exec.remainingStock, exec.totalStock);
                const isExpanded = expandedExecutive === exec.executiveId;

                return (
                  <div key={exec.executiveId} className="group bg-white hover:bg-gray-50 transition-colors border-b last:border-0">
                    {/* --- STEP 3 FIX: Responsive Row Layout --- */}
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpand(exec.executiveId)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        
                        {/* Left Side: Avatar & Name */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                            {exec.executiveName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{exec.executiveName}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">ID: {exec.executiveId}</span>
                              {/* Mobile-only Status Badge */}
                              <span className={`sm:hidden text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color} bg-opacity-10`}>
                                {status.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Stats Grid */}
                        {/* On Mobile: This becomes a 3-column grid below the name */}
                        {/* On Desktop: This becomes a flex row on the right */}
                        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-8 mt-2 sm:mt-0">
                          <div className="bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded text-center sm:text-right">
                            <p className="text-[10px] text-gray-500 uppercase">Assigned</p>
                            <p className="font-bold text-gray-900">{exec.totalStock}</p>
                          </div>
                          <div className="bg-purple-50 sm:bg-transparent p-2 sm:p-0 rounded text-center sm:text-right">
                            <p className="text-[10px] text-purple-600 sm:text-gray-500 uppercase">Distributed</p>
                            <p className="font-bold text-purple-700 sm:text-gray-900">{exec.totalDistributed}</p>
                          </div>
                          <div className="bg-orange-50 sm:bg-transparent p-2 sm:p-0 rounded text-center sm:text-right">
                            <p className="text-[10px] text-orange-600 sm:text-gray-500 uppercase">Remaining</p>
                            <p className={`font-bold ${status.color}`}>{exec.remainingStock}</p>
                          </div>
                          
                          {/* Desktop-only Status Badge & Chevron */}
                          <div className="hidden sm:flex items-center gap-4 pl-4 border-l">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color} bg-opacity-10`}>
                              {status.label}
                            </span>
                            {isExpanded ? <ChevronLeft className="h-4 w-4 rotate-90 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details (Inner Table) */}
                    {isExpanded && (
                      <div className="bg-gray-50/50 border-t border-gray-100 p-3 sm:p-4">
                        {exec.stockItems.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-2">No stock assigned.</p>
                        ) : (
                          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="text-left py-2 px-3 font-medium text-gray-500">Book Title</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-500">Assigned</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-500 hidden sm:table-cell">Distributed</th>
                                  <th className="text-center py-2 px-3 font-medium text-gray-500">Remaining</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {exec.stockItems.map((item) => {
                                  const itemStatus = getStockStatus(item.remainingStock, item.totalAssigned);
                                  return (
                                    <tr key={item.bookId}>
                                      <td className="py-2 px-3 font-medium text-gray-900">{item.bookTitle}</td>
                                      <td className="py-2 px-3 text-center text-gray-600">{item.totalAssigned}</td>
                                      <td className="py-2 px-3 text-center text-purple-600 hidden sm:table-cell">{item.totalDistributed}</td>
                                      <td className="py-2 px-3 text-center">
                                        <span className={`font-bold ${itemStatus.color}`}>{item.remainingStock}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
       {/* Pagination Controls */}
          {!isLoading && filteredData.length > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t">
              <div className="text-sm text-gray-500 text-center sm:text-left">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} executives
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <span className="text-sm text-gray-600 mr-2 hidden sm:inline">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex-1 sm:flex-none"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
